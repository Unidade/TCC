"""
Persona service for CRUD operations
"""
import aiosqlite
import logging
from typing import List, Optional
from datetime import datetime
from app.models import PersonaCreate, PersonaUpdate, PersonaResponse
from app.database import DB_PATH

logger = logging.getLogger(__name__)


class PersonaService:
    @staticmethod
    async def get_all() -> List[PersonaResponse]:
        """Get all personas"""
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("""
                SELECT id, name, description, system_prompt, initial_message, language, created_at, updated_at
                FROM personas
                ORDER BY created_at DESC
            """)
            rows = await cursor.fetchall()
            return [PersonaResponse(**dict(row)) for row in rows]

    @staticmethod
    async def get_by_id(persona_id: int) -> Optional[PersonaResponse]:
        """Get persona by ID"""
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("""
                SELECT id, name, description, system_prompt, initial_message, language, created_at, updated_at
                FROM personas
                WHERE id = ?
            """, (persona_id,))
            row = await cursor.fetchone()
            if row:
                return PersonaResponse(**dict(row))
            return None

    @staticmethod
    async def create(persona: PersonaCreate) -> PersonaResponse:
        """Create a new persona"""
        now = datetime.utcnow().isoformat()
        async with aiosqlite.connect(DB_PATH) as db:
            cursor = await db.execute("""
                INSERT INTO personas (name, description, system_prompt, initial_message, language, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                persona.name,
                persona.description,
                persona.system_prompt,
                persona.initial_message,
                persona.language.value,
                now,
                now
            ))
            await db.commit()
            persona_id = cursor.lastrowid
            return await PersonaService.get_by_id(persona_id)

    @staticmethod
    async def update(persona_id: int, persona_update: PersonaUpdate) -> Optional[PersonaResponse]:
        """Update an existing persona"""
        # Get existing persona
        existing = await PersonaService.get_by_id(persona_id)
        if not existing:
            return None

        # Build update query dynamically
        updates = []
        values = []

        if persona_update.name is not None:
            updates.append("name = ?")
            values.append(persona_update.name)
        if persona_update.description is not None:
            updates.append("description = ?")
            values.append(persona_update.description)
        if persona_update.system_prompt is not None:
            updates.append("system_prompt = ?")
            values.append(persona_update.system_prompt)
        if persona_update.initial_message is not None:
            updates.append("initial_message = ?")
            values.append(persona_update.initial_message)
        if persona_update.language is not None:
            updates.append("language = ?")
            values.append(persona_update.language.value)

        if not updates:
            return existing

        updates.append("updated_at = ?")
        values.append(datetime.utcnow().isoformat())
        values.append(persona_id)

        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(f"""
                UPDATE personas
                SET {', '.join(updates)}
                WHERE id = ?
            """, values)
            await db.commit()
            return await PersonaService.get_by_id(persona_id)

    @staticmethod
    async def delete(persona_id: int) -> bool:
        """Delete a persona"""
        async with aiosqlite.connect(DB_PATH) as db:
            cursor = await db.execute("DELETE FROM personas WHERE id = ?", (persona_id,))
            await db.commit()
            return cursor.rowcount > 0
