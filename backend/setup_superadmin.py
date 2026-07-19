"""
Ejecutar UNA SOLA VEZ en el VPS para:
  1. Crear usuario superadmin en MongoDB
  2. Crear entradas en la colección 'clubs' para Racing San Gabriel y SUDEPORTE DEMO

Uso:
  docker exec sudeporte_api python setup_superadmin.py

Variables de entorno necesarias: MONGO_URL, DB_NAME (las mismas del .env)
"""

import asyncio
import os
import bcrypt
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']

# ─── CONFIGURACIÓN — cambia antes de ejecutar ───────────────────────────────
SUPERADMIN_EMAIL    = "david@sudeporte.com"   # email de acceso al superadmin
SUPERADMIN_PASSWORD = "CAMBIA_ESTA_CLAVE"     # contraseña segura
SUPERADMIN_NAME     = "David SUDEPORTE"
# ─────────────────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    now = datetime.now(timezone.utc).isoformat()

    # ── 1. Usuario superadmin ────────────────────────────────────────────────
    existing = await db.users.find_one({"email": SUPERADMIN_EMAIL.lower()})
    if existing:
        print(f"[SKIP] Usuario superadmin ya existe: {SUPERADMIN_EMAIL}")
    else:
        result = await db.users.insert_one({
            "email": SUPERADMIN_EMAIL.lower(),
            "password_hash": hash_password(SUPERADMIN_PASSWORD),
            "name": SUPERADMIN_NAME,
            "role": "superadmin",
            "club_id": "superadmin",
            "created_at": now,
        })
        print(f"[OK] Superadmin creado → id={result.inserted_id}  email={SUPERADMIN_EMAIL}")

    # ── 2. Club: Racing San Gabriel ──────────────────────────────────────────
    existing_club = await db.clubs.find_one({"club_id": "racing_sangabriel"})
    if existing_club:
        print("[SKIP] Club 'racing_sangabriel' ya existe en la colección clubs")
    else:
        await db.clubs.insert_one({
            "club_id": "racing_sangabriel",
            "nombre": "Racing San Gabriel A.D.C.",
            "plan": "pack_club",
            "modulos_activos": [
                "gestion_base", "socios", "inscripciones",
                "comunicaciones", "cobros", "stripe", "sepa"
            ],
            "activo": True,
            "fecha_alta": "2024-01-01",
            "email_contacto": "admin@racingsangabriel.es",
            "url_web": "https://racing-sangabriel.netlify.app",
            "url_admin": "https://admin-racing-sangabriel.netlify.app/admin",
            "notes": "Club piloto — primer cliente en producción",
            "created_at": now,
        })
        print("[OK] Club 'racing_sangabriel' creado en colección clubs")

    # ── 3. Club: SUDEPORTE DEMO ──────────────────────────────────────────────
    existing_demo = await db.clubs.find_one({"club_id": "sudeporte-demo"})
    if existing_demo:
        print("[SKIP] Club 'sudeporte-demo' ya existe en la colección clubs")
    else:
        await db.clubs.insert_one({
            "club_id": "sudeporte-demo",
            "nombre": "SUDEPORTE DEMO",
            "plan": "pack_total",
            "modulos_activos": [
                "gestion_base", "socios", "inscripciones",
                "comunicaciones", "cobros", "stripe", "sepa", "contabilidad"
            ],
            "activo": True,
            "fecha_alta": now[:10],
            "email_contacto": "demo@sudeporte.com",
            "url_web": "https://demo.sudeporte.com",
            "url_admin": "https://admin-demo.sudeporte.com/admin",
            "notes": "Club demo interno — para presentaciones y pruebas. Usar 'Resetear DEMO' desde el superadmin.",
            "created_at": now,
        })
        print("[OK] Club 'sudeporte-demo' creado en colección clubs")

    # ── 4. Usuario admin del club DEMO ───────────────────────────────────────
    existing_demo_user = await db.users.find_one({"email": "demo@sudeporte.com"})
    if existing_demo_user:
        print("[SKIP] Usuario admin del DEMO ya existe")
    else:
        result = await db.users.insert_one({
            "email": "demo@sudeporte.com",
            "password_hash": hash_password("sudeporte-demo-2026"),
            "name": "Admin DEMO",
            "role": "admin",
            "club_id": "sudeporte-demo",
            "created_at": now,
        })
        print(f"[OK] Usuario admin DEMO creado → email=demo@sudeporte.com  pass=sudeporte-demo-2026")

    client.close()
    print("\n✓ Setup completado.")

if __name__ == "__main__":
    asyncio.run(main())
