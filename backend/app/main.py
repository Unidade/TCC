"""
FastAPI application with AI SDK compatible streaming endpoint
"""
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
import logging
from contextlib import asynccontextmanager
from app.llm import OllamaClient
from app.tts import KokoroTTS
from app.database import init_db
from app.routers import personas
from app.services.persona_service import PersonaService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database
    await init_db()
    yield
    # Shutdown: cleanup if needed
    pass


app = FastAPI(title="TCC Interview Simulator", lifespan=lifespan)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(personas.router)

# Store conversation per session (simple in-memory, could use Redis for production)
conversations: dict[str, OllamaClient] = {}
tts_client = KokoroTTS(language="pt-BR")


@app.get("/")
async def root():
    return {"message": "TCC Interview Simulator API"}


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}


@app.get("/api/initial")
async def get_initial_message(persona_id: int = None):
    """
    Get initial greeting message with audio
    If persona_id is provided, use that persona's initial message
    Otherwise, use the first persona (default)
    """
    try:
        # Get persona
        if persona_id:
            persona = await PersonaService.get_by_id(persona_id)
            if not persona:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Persona with id {persona_id} not found"
                )
        else:
            # Get first persona (default)
            personas_list = await PersonaService.get_all()
            if not personas_list:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No personas found"
                )
            persona = personas_list[0]

        initial_message = persona.initial_message
        audio_base64, duration = tts_client.synthesize_to_base64(initial_message)
        return {
            "text": initial_message,
            "audio": audio_base64,
            "duration": duration,
            "persona_id": persona.id,
            "persona_name": persona.name
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating initial audio: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating initial audio: {str(e)}"
        )


@app.post("/api/chat")
async def chat(request: Request):
    """
    AI SDK compatible chat endpoint with streaming response
    Returns text/event-stream for AI SDK useChat hook
    """
    body = await request.json()
    messages = body.get("messages", [])
    session_id = request.headers.get("x-session-id", "default")
    persona_id = body.get("persona_id") or request.headers.get("x-persona-id")

    # Get persona
    system_prompt = None
    if persona_id:
        try:
            persona = await PersonaService.get_by_id(int(persona_id))
            if persona:
                system_prompt = persona.system_prompt
        except (ValueError, TypeError):
            pass

    # Get or create conversation client
    if session_id not in conversations:
        conversations[session_id] = OllamaClient(system_prompt=system_prompt)
    else:
        # Update system prompt if persona changed
        if system_prompt and conversations[session_id].system_prompt != system_prompt:
            conversations[session_id].system_prompt = system_prompt
            conversations[session_id].is_first_message = True

    llm_client = conversations[session_id]

    # Get the last user message
    user_message = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            user_message = msg.get("content", "")
            break

    if not user_message:
        return {"error": "No user message provided"}

    logger.info(f"Received message: {user_message[:50]}...")

    async def generate():
        try:
            # Get LLM response
            response_text = llm_client.chat(user_message)
            logger.info(f"LLM response: {response_text[:50]}...")

            # Stream the text response in AI SDK format
            # Format: data: {"type":"text","value":"..."}\n\n
            yield f'0:"{response_text}"\n'

            # Generate audio after text
            try:
                audio_base64, duration = tts_client.synthesize_to_base64(response_text)
                # Send audio as data message
                audio_data = json.dumps({
                    "audio": audio_base64,
                    "duration": duration
                })
                yield f'2:[{{"audio":"{audio_base64}","duration":{duration}}}]\n'
            except Exception as e:
                logger.error(f"Error generating audio: {e}")

            # End stream
            yield 'd:{"finishReason":"stop"}\n'

        except Exception as e:
            logger.error(f"Error in chat: {e}")
            yield f'3:"{str(e)}"\n'

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.post("/api/chat/simple")
async def chat_simple(request: Request):
    """
    Simple non-streaming chat endpoint (fallback)
    Returns JSON with text and audio
    """
    body = await request.json()
    messages = body.get("messages", [])
    session_id = request.headers.get("x-session-id", "default")
    persona_id = body.get("persona_id") or request.headers.get("x-persona-id")

    # Get persona
    system_prompt = None
    if persona_id:
        try:
            persona = await PersonaService.get_by_id(int(persona_id))
            if persona:
                system_prompt = persona.system_prompt
        except (ValueError, TypeError):
            pass

    # Get or create conversation client
    if session_id not in conversations:
        conversations[session_id] = OllamaClient(system_prompt=system_prompt)
    else:
        # Update system prompt if persona changed
        if system_prompt and conversations[session_id].system_prompt != system_prompt:
            conversations[session_id].system_prompt = system_prompt
            conversations[session_id].is_first_message = True

    llm_client = conversations[session_id]

    # Get the last user message
    user_message = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            user_message = msg.get("content", "")
            break

    if not user_message:
        return {"error": "No user message provided"}

    try:
        # Get LLM response
        response_text = llm_client.chat(user_message)

        # Generate audio
        try:
            audio_base64, duration = tts_client.synthesize_to_base64(response_text)
        except Exception as e:
            logger.error(f"Error generating audio: {e}")
            audio_base64 = None
            duration = 0

        return {
            "text": response_text,
            "audio": audio_base64,
            "duration": duration
        }
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        return {"error": str(e)}


@app.delete("/api/session/{session_id}")
async def clear_session(session_id: str):
    """Clear conversation history for a session"""
    if session_id in conversations:
        del conversations[session_id]
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
