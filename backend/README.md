# Backend - TCC Interview Simulator

Python FastAPI backend for the interview simulator with Ollama LLM and Kokoro TTS.

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Make sure Ollama is running locally with the model `google/gemma-3-4b-it`:
```bash
ollama pull google/gemma-3-4b-it
```

3. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
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
