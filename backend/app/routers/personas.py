"""
Persona management router
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models import PersonaCreate, PersonaUpdate, PersonaResponse
from app.services.persona_service import PersonaService

router = APIRouter(prefix="/api/personas", tags=["personas"])


@router.get("/", response_model=List[PersonaResponse])
async def list_personas():
    """List all personas"""
    return await PersonaService.get_all()


@router.get("/{persona_id}", response_model=PersonaResponse)
async def get_persona(persona_id: int):
    """Get a single persona by ID"""
    persona = await PersonaService.get_by_id(persona_id)
    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Persona with id {persona_id} not found"
        )
    return persona


@router.post("/", response_model=PersonaResponse, status_code=status.HTTP_201_CREATED)
async def create_persona(persona: PersonaCreate):
    """Create a new persona"""
    return await PersonaService.create(persona)


@router.put("/{persona_id}", response_model=PersonaResponse)
async def update_persona(persona_id: int, persona_update: PersonaUpdate):
    """Update an existing persona"""
    updated = await PersonaService.update(persona_id, persona_update)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Persona with id {persona_id} not found"
        )
    return updated


@router.delete("/{persona_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_persona(persona_id: int):
    """Delete a persona"""
    deleted = await PersonaService.delete(persona_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Persona with id {persona_id} not found"
        )
