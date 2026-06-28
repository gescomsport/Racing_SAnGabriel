"""
Migration script: Add club_id = "racing_sangabriel" to all existing MongoDB documents.
Run once when deploying multi-tenant support to production.

Usage:
    cd backend
    python3 migrate_add_club_id.py
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ.get("DB_NAME", "sudeporte")
CLUB_ID = "racing_sangabriel"

COLLECTIONS = [
    "news", "teams", "players", "guardians", "matches",
    "gallery", "contacts", "products", "fees", "members",
    "facilities", "schedule_templates", "schedule_events",
    "calendar_templates", "calendar_events", "sponsors",
    "social_posts", "settings", "sepa_mandates", "sales",
    "gdpr_records", "gdpr_config", "communications",
]

async def migrate():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    print(f"Connecting to MongoDB: {DB_NAME}")
    print(f"Stamping all documents with club_id = '{CLUB_ID}'\n")

    for coll_name in COLLECTIONS:
        coll = db[coll_name]
        result = await coll.update_many(
            {"club_id": {"$exists": False}},
            {"$set": {"club_id": CLUB_ID}}
        )
        print(f"  {coll_name:30s} → {result.modified_count} docs updated")

    # Also update users collection for admin users
    result = await db.users.update_many(
        {"club_id": {"$exists": False}},
        {"$set": {"club_id": CLUB_ID}}
    )
    print(f"  {'users':30s} → {result.modified_count} docs updated")

    print("\nMigration complete.")
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate())
