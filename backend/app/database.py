"""
Database setup and initialization for SQLite
"""
import aiosqlite
import logging
from pathlib import Path
from datetime import datetime
from app.persona import SYSTEM_PROMPT, INITIAL_MESSAGE

logger = logging.getLogger(__name__)

# Database path relative to backend directory
DB_PATH = Path(__file__).parent.parent / "personas.db"

async def init_db():
    """Initialize database and create tables"""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS personas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                system_prompt TEXT NOT NULL,
                initial_message TEXT NOT NULL,
                language TEXT NOT NULL DEFAULT 'pt-BR',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        await db.commit()

        # Check if Carlos Silva persona exists
        cursor = await db.execute("SELECT COUNT(*) FROM personas WHERE name = ?", ("Carlos Silva",))
        count = (await cursor.fetchone())[0]

        if count == 0:
            # Seed default persona
            now = datetime.utcnow().isoformat()
            await db.execute("""
                INSERT INTO personas (name, description, system_prompt, initial_message, language, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                "Carlos Silva",
                "Cliente leigo em tecnologia para treino de elicitação de requisitos - Projeto RecipeShare",
                SYSTEM_PROMPT,
                INITIAL_MESSAGE,
                "pt-BR",
                now,
                now
            ))
            await db.commit()
            logger.info("Default persona 'Carlos Silva' seeded successfully")

async def get_db():
    """Get database connection"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db
