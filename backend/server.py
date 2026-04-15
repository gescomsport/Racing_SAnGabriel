from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Request, HTTPException, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import uuid
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token invalido")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalido")

# Pydantic models
class LoginRequest(BaseModel):
    email: str
    password: str

class NewsCreate(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = ""
    source: Optional[str] = "web"
    category: Optional[str] = "general"

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    source: Optional[str] = None
    category: Optional[str] = None

class TeamCreate(BaseModel):
    name: str
    category: str
    coach: Optional[str] = ""
    image_url: Optional[str] = ""
    description: Optional[str] = ""

class PlayerCreate(BaseModel):
    name: str
    position: str
    number: Optional[int] = None
    team_id: str
    image_url: Optional[str] = ""

class MatchCreate(BaseModel):
    home_team: str
    away_team: str
    date: str
    time: str
    location: str
    category: Optional[str] = ""
    result: Optional[str] = ""
    status: Optional[str] = "upcoming"

class GalleryCreate(BaseModel):
    title: str
    image_url: str
    description: Optional[str] = ""
    category: Optional[str] = "general"

class ContactCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = ""
    message: str
    subject: Optional[str] = "general"

class SettingsUpdate(BaseModel):
    club_name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    instagram_url: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_username: Optional[str] = None
    facebook_page: Optional[str] = None
    # Social feed integration
    facebook_embed_enabled: Optional[bool] = None
    facebook_page_url: Optional[str] = None
    instagram_embed_code: Optional[str] = None
    social_feed_provider: Optional[str] = None
    custom_embed_code: Optional[str] = None

# Create app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- AUTH ENDPOINTS ---
@api_router.post("/auth/login")
async def login(request_data: LoginRequest, response: Response):
    email = request_data.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(request_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "email": user["email"], "name": user.get("name", ""), "role": user.get("role", "admin"), "token": access_token}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Sesion cerrada"}

# --- NEWS ENDPOINTS ---
@api_router.get("/news")
async def get_news(limit: int = 50):
    news = await db.news.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return news

@api_router.post("/news")
async def create_news(data: NewsCreate, request: Request):
    await get_current_user(request)
    doc = data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.news.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.put("/news/{news_id}")
async def update_news(news_id: str, data: NewsUpdate, request: Request):
    await get_current_user(request)
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.news.update_one({"id": news_id}, {"$set": update_data})
    updated = await db.news.find_one({"id": news_id}, {"_id": 0})
    return updated

@api_router.delete("/news/{news_id}")
async def delete_news(news_id: str, request: Request):
    await get_current_user(request)
    await db.news.delete_one({"id": news_id})
    return {"message": "Noticia eliminada"}

# --- TEAMS ENDPOINTS ---
@api_router.get("/teams")
async def get_teams():
    teams = await db.teams.find({}, {"_id": 0}).to_list(100)
    return teams

@api_router.post("/teams")
async def create_team(data: TeamCreate, request: Request):
    await get_current_user(request)
    doc = data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.teams.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.put("/teams/{team_id}")
async def update_team(team_id: str, data: TeamCreate, request: Request):
    await get_current_user(request)
    update_data = data.model_dump()
    await db.teams.update_one({"id": team_id}, {"$set": update_data})
    updated = await db.teams.find_one({"id": team_id}, {"_id": 0})
    return updated

@api_router.delete("/teams/{team_id}")
async def delete_team(team_id: str, request: Request):
    await get_current_user(request)
    await db.teams.delete_one({"id": team_id})
    await db.players.delete_many({"team_id": team_id})
    return {"message": "Equipo eliminado"}

# --- PLAYERS ENDPOINTS ---
@api_router.get("/players")
async def get_players(team_id: Optional[str] = None):
    query = {"team_id": team_id} if team_id else {}
    players = await db.players.find(query, {"_id": 0}).to_list(500)
    return players

@api_router.post("/players")
async def create_player(data: PlayerCreate, request: Request):
    await get_current_user(request)
    doc = data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.players.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.delete("/players/{player_id}")
async def delete_player(player_id: str, request: Request):
    await get_current_user(request)
    await db.players.delete_one({"id": player_id})
    return {"message": "Jugador eliminado"}

# --- MATCHES ENDPOINTS ---
@api_router.get("/matches")
async def get_matches(status: Optional[str] = None):
    query = {"status": status} if status else {}
    matches = await db.matches.find(query, {"_id": 0}).sort("date", 1).to_list(200)
    return matches

@api_router.post("/matches")
async def create_match(data: MatchCreate, request: Request):
    await get_current_user(request)
    doc = data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.matches.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.put("/matches/{match_id}")
async def update_match(match_id: str, data: MatchCreate, request: Request):
    await get_current_user(request)
    update_data = data.model_dump()
    await db.matches.update_one({"id": match_id}, {"$set": update_data})
    updated = await db.matches.find_one({"id": match_id}, {"_id": 0})
    return updated

@api_router.delete("/matches/{match_id}")
async def delete_match(match_id: str, request: Request):
    await get_current_user(request)
    await db.matches.delete_one({"id": match_id})
    return {"message": "Partido eliminado"}

# --- GALLERY ENDPOINTS ---
@api_router.get("/gallery")
async def get_gallery():
    items = await db.gallery.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items

@api_router.post("/gallery")
async def create_gallery_item(data: GalleryCreate, request: Request):
    await get_current_user(request)
    doc = data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.gallery.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.delete("/gallery/{item_id}")
async def delete_gallery_item(item_id: str, request: Request):
    await get_current_user(request)
    await db.gallery.delete_one({"id": item_id})
    return {"message": "Imagen eliminada"}

# --- CONTACT ENDPOINTS ---
@api_router.post("/contact")
async def submit_contact(data: ContactCreate):
    doc = data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["read"] = False
    await db.contacts.insert_one(doc)
    return {"message": "Mensaje enviado correctamente"}

@api_router.get("/contact")
async def get_contacts(request: Request):
    await get_current_user(request)
    contacts = await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return contacts

@api_router.delete("/contact/{contact_id}")
async def delete_contact(contact_id: str, request: Request):
    await get_current_user(request)
    await db.contacts.delete_one({"id": contact_id})
    return {"message": "Mensaje eliminado"}

# --- SETTINGS ENDPOINTS ---
@api_router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({"type": "club"}, {"_id": 0})
    if not settings:
        settings = {
            "type": "club",
            "club_name": "Racing San Gabriel ADC",
            "description": "Club deportivo multidisciplinar comprometido con el desarrollo deportivo y social de nuestra comunidad.",
            "address": "San Gabriel, Alicante",
            "phone": "+34 600 000 000",
            "email": "info@racingsangabriel.es",
            "instagram_url": "https://www.instagram.com/racingsangabrieladc/",
            "facebook_url": "https://www.facebook.com/RacingSanGabrielADC/",
            "instagram_username": "racingsangabrieladc",
            "facebook_page": "RacingSanGabrielADC",
            "facebook_embed_enabled": True,
            "facebook_page_url": "https://www.facebook.com/RacingSanGabrielADC/",
            "instagram_embed_code": "",
            "social_feed_provider": "none",
            "custom_embed_code": ""
        }
        await db.settings.insert_one(settings)
        settings.pop("_id", None)
    return settings

@api_router.put("/settings")
async def update_settings(data: SettingsUpdate, request: Request):
    await get_current_user(request)
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.settings.update_one({"type": "club"}, {"$set": update_data}, upsert=True)
    settings = await db.settings.find_one({"type": "club"}, {"_id": 0})
    return settings

# Health check
@api_router.get("/health")
async def health():
    return {"status": "ok"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await seed_admin()
    await seed_demo_data()

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@racingsangabriel.es")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Racing2025!")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Administrador",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")

async def seed_demo_data():
    # Seed teams if empty
    count = await db.teams.count_documents({})
    if count == 0:
        teams = [
            {"id": str(uuid.uuid4()), "name": "Juvenil A", "category": "Juvenil", "coach": "Carlos Martinez", "image_url": "https://customer-assets.emergentagent.com/job_sg-racing-portal/artifacts/twkjfnq4_image.png", "description": "Equipo juvenil categoría A", "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Cadete B", "category": "Cadete", "coach": "Miguel Lopez", "image_url": "", "description": "Equipo cadete categoría B", "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Infantil A", "category": "Infantil", "coach": "Ana Garcia", "image_url": "", "description": "Equipo infantil categoría A", "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.teams.insert_many(teams)

    # Seed matches if empty
    count = await db.matches.count_documents({})
    if count == 0:
        matches = [
            {"id": str(uuid.uuid4()), "home_team": "Racing San Gabriel", "away_team": "CD Alicante", "date": "2025-02-15", "time": "10:30", "location": "Campo Municipal San Gabriel", "category": "Juvenil", "result": "2-1", "status": "played", "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "home_team": "Racing San Gabriel", "away_team": "CF Intercity B", "date": "2025-02-22", "time": "12:00", "location": "Campo Municipal San Gabriel", "category": "Juvenil", "result": "", "status": "upcoming", "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "home_team": "Hércules CF C", "away_team": "Racing San Gabriel", "date": "2025-03-01", "time": "11:00", "location": "Estadio Rico Pérez", "category": "Cadete", "result": "", "status": "upcoming", "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.matches.insert_many(matches)

    # Seed news if empty
    count = await db.news.count_documents({})
    if count == 0:
        news = [
            {"id": str(uuid.uuid4()), "title": "Gran victoria del Juvenil A", "content": "Nuestro equipo juvenil consiguió una importante victoria este fin de semana frente al CD Alicante con un resultado de 2-1. Gran trabajo de todo el equipo.", "image_url": "https://customer-assets.emergentagent.com/job_sg-racing-portal/artifacts/twkjfnq4_image.png", "source": "web", "category": "resultados", "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "title": "Abiertas las inscripciones temporada 2025/2026", "content": "Ya están abiertas las inscripciones para la próxima temporada. Contacta con nosotros para más información sobre las categorías disponibles.", "image_url": "", "source": "web", "category": "general", "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "title": "Torneo de Navidad", "content": "El club organiza el tradicional torneo de Navidad para todas las categorías. ¡No te lo pierdas!", "image_url": "", "source": "instagram", "category": "eventos", "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.news.insert_many(news)

    # Seed gallery if empty
    count = await db.gallery.count_documents({})
    if count == 0:
        gallery = [
            {"id": str(uuid.uuid4()), "title": "Equipo Juvenil A 2024/2025", "image_url": "https://customer-assets.emergentagent.com/job_sg-racing-portal/artifacts/twkjfnq4_image.png", "description": "Foto oficial del equipo juvenil", "category": "equipos", "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "title": "Partido en casa", "image_url": "https://images.pexels.com/photos/36213470/pexels-photo-36213470.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "description": "Acción durante partido de liga", "category": "partidos", "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "title": "Estadio", "image_url": "https://static.prod-images.emergentagent.com/jobs/aa4aac70-2da7-49b9-b970-59a86d8b85ed/images/2e97b7f318b408c34d0d83e3483ffb1fb1d9ea389c42fb72c00f0fdd9219dad4.png", "description": "Vista del estadio", "category": "instalaciones", "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.gallery.insert_many(gallery)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
