# Backend - TCC Interview Simulator

Python FastAPI backend for the interview simulator with Ollama LLM and Kokoro TTS.

### UV Requirements

- **Python ≥ 3.10**
- **uv ≥ 0.4**
- **Ollama installed & running**

### UV Setup (Correct Commands)

```bash
# Initialize project (if not already)
uv init

# Create & use virtual environment
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Add dependencies
uv add fastapi uvicorn ollama kokoro python-multipart

# Install from lockfile (CI/clean setups)
uv sync
```

### Run Server (via uv)

```bash
uv run uvicorn app.main:app --reload --port 8000
```

### Ollama Requirement

```bash
ollama pull google/gemma-3-4b-it
ollama serve
```

## API Endpoints

### REST Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /api/initial` - Get initial greeting message with audio

### Chat Endpoints

#### Simple Chat (Recommended)

```
POST /api/chat/simple
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "Hello"}
  ]
}
```

**Response:**

```json
{
  "text": "Response text",
  "audio": "base64_encoded_wav",
  "duration": 1.23
}
```

#### Streaming Chat (AI SDK Compatible)

```
POST /api/chat
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "Hello"}
  ]
}
```

Returns `text/event-stream` compatible with Vercel AI SDK.

### Session Management

Each chat session is identified by the `x-session-id` header. Conversation history is maintained per session.

```
DELETE /api/session/{session_id}
```

Clears the conversation history for a specific session.

## Architecture

- **FastAPI** - Modern async Python web framework
- **Ollama** - Local LLM inference (gemma-3-4b-it)
- **Kokoro TTS** - Text-to-speech for Portuguese Brazilian
