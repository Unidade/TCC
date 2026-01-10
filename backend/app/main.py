"""
FastAPI application with AI SDK compatible streaming endpoint
"""
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
import logging
import sys
import requests
from contextlib import asynccontextmanager
from app.llm import OllamaClient
from app.tts import KokoroTTS
from app.database import init_db
from app.routers import personas
from app.services.persona_service import PersonaService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "gemma3:1b"


class StartupError(Exception):
    """Raised when a critical dependency check fails at startup"""
    pass


def check_ollama_running() -> bool:
    """Check if Ollama service is running"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False


def check_ollama_model_available(model: str) -> bool:
    """Check if the required model is available in Ollama"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if response.status_code != 200:
            return False
        
        data = response.json()
        models = data.get("models", [])
        model_names = [m.get("name", "") for m in models]
        
        # Check for exact match or match without tag (e.g., "qwen2.5:1.5b" or "qwen2.5")
        for available_model in model_names:
            if available_model == model or available_model.startswith(f"{model}:"):
                return True
            # Also check if requested model matches available (with or without :latest)
            if model == available_model.replace(":latest", "") or available_model == f"{model}:latest":
                return True
        
        return False
    except requests.exceptions.RequestException:
        return False


def get_available_ollama_models() -> list[str]:
    """Get list of available Ollama models"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if response.status_code != 200:
            return []
        
        data = response.json()
        return [m.get("name", "") for m in data.get("models", [])]
    except requests.exceptions.RequestException:
        return []


def check_tts_available() -> tuple[bool, str]:
    """Check if Kokoro TTS is properly configured"""
    try:
        from kokoro import KPipeline
        # Try to initialize the pipeline
        pipeline = KPipeline(lang_code="p")  # Portuguese
        return True, "Kokoro TTS initialized successfully"
    except ImportError as e:
        return False, f"Kokoro TTS not installed: {e}"
    except Exception as e:
        return False, f"Kokoro TTS initialization error: {e}"


def validate_startup_dependencies():
    """
    Validate all required dependencies at startup.
    Raises StartupError if critical dependencies are missing.
    """
    errors = []
    warnings = []
    
    logger.info("=" * 60)
    logger.info("Validating startup dependencies...")
    logger.info("=" * 60)
    
    # Check 1: Ollama service
    logger.info("Checking Ollama service...")
    if not check_ollama_running():
        errors.append(
            f"❌ Ollama is not running at {OLLAMA_BASE_URL}\n"
            f"   Please start Ollama with: ollama serve"
        )
    else:
        logger.info(f"✅ Ollama is running at {OLLAMA_BASE_URL}")
        
        # Check 2: Required model
        logger.info(f"Checking for model '{OLLAMA_MODEL}'...")
        if not check_ollama_model_available(OLLAMA_MODEL):
            available_models = get_available_ollama_models()
            if available_models:
                models_list = ", ".join(available_models)
                errors.append(
                    f"❌ Model '{OLLAMA_MODEL}' not found in Ollama\n"
                    f"   Available models: {models_list}\n"
                    f"   Please run: ollama pull {OLLAMA_MODEL}"
                )
            else:
                errors.append(
                    f"❌ Model '{OLLAMA_MODEL}' not found. No models installed.\n"
                    f"   Please run: ollama pull {OLLAMA_MODEL}"
                )
        else:
            logger.info(f"✅ Model '{OLLAMA_MODEL}' is available")
    
    # Check 3: TTS
    logger.info("Checking TTS service...")
    tts_ok, tts_message = check_tts_available()
    if not tts_ok:
        warnings.append(f"⚠️  TTS Warning: {tts_message}")
        logger.warning(f"⚠️  TTS Warning: {tts_message}")
    else:
        logger.info(f"✅ {tts_message}")
    
    # Report results
    logger.info("=" * 60)
    
    if errors:
        logger.error("Startup validation FAILED!")
        logger.error("-" * 60)
        for error in errors:
            for line in error.split("\n"):
                logger.error(line)
        logger.error("-" * 60)
        logger.error("Please fix the above issues and restart the server.")
        raise StartupError("\n".join(errors))
    
    if warnings:
        for warning in warnings:
            logger.warning(warning)
    
    logger.info("✅ All dependency checks passed!")
    logger.info("=" * 60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Validate dependencies first
    try:
        validate_startup_dependencies()
    except StartupError as e:
        logger.error("Server cannot start due to missing dependencies")
        sys.exit(1)
    
    # Initialize database
    await init_db()
    
    logger.info("🚀 Server started successfully!")
    yield
    # Shutdown: cleanup if needed
    logger.info("👋 Server shutting down...")


app = FastAPI(title="TCC Interview Simulator", lifespan=lifespan)

# CORS middleware for frontend (allow all origins for dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
        audio_base64, duration = await tts_client.synthesize_to_base64_async(initial_message)
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
        conversations[session_id] = OllamaClient(
            base_url=OLLAMA_BASE_URL,
            model=OLLAMA_MODEL,
            system_prompt=system_prompt
        )
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
            response_text = await llm_client.chat(user_message)
            logger.info(f"LLM response: {response_text[:50]}...")

            # Stream the text response in AI SDK format
            # Format: data: {"type":"text","value":"..."}\n\n
            yield f'0:"{response_text}"\n'

            # Generate audio after text
            try:
                audio_base64, duration = await tts_client.synthesize_to_base64_async(response_text)
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
        conversations[session_id] = OllamaClient(
            base_url=OLLAMA_BASE_URL,
            model=OLLAMA_MODEL,
            system_prompt=system_prompt
        )
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
        response_text = await llm_client.chat(user_message)

        # Generate audio
        try:
            audio_base64, duration = await tts_client.synthesize_to_base64_async(response_text)
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
