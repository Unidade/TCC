"""
Pydantic models for persona validation
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class Language(str, Enum):
    PT_BR = "pt-BR"
    EN = "en"


class PersonaBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Persona name")
    description: Optional[str] = Field(None, max_length=500, description="Persona description")
    system_prompt: str = Field(..., min_length=10, description="System prompt for LLM")
    initial_message: str = Field(..., min_length=1, description="Initial greeting message")
    language: Language = Field(default=Language.PT_BR, description="Language code")


class PersonaCreate(PersonaBase):
    pass


class PersonaUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    system_prompt: Optional[str] = Field(None, min_length=10)
    initial_message: Optional[str] = Field(None, min_length=1)
    language: Optional[Language] = None


class PersonaResponse(PersonaBase):
    id: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
