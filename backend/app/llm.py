"""
Ollama LLM integration for conversation (async version)
"""
import httpx
from typing import Optional


class OllamaClient:
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "qwen2.5:1.5b", system_prompt: Optional[str] = None):
        self.base_url = base_url
        self.model = model
        self.system_prompt = system_prompt
        self.conversation_history = []
        self.is_first_message = True

    async def chat(self, user_message: str) -> str:
        """
        Send message to Ollama and get response (async, non-blocking)
        """
        # Add system prompt only on first message
        if self.is_first_message:
            messages = []
            if self.system_prompt:
                messages.append({"role": "system", "content": self.system_prompt})
            messages.append({"role": "user", "content": user_message})
            self.is_first_message = False
        else:
            messages = self.conversation_history + [{"role": "user", "content": user_message}]

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "stream": False
                    }
                )
                response.raise_for_status()

            result = response.json()
            assistant_message = result.get("message", {}).get("content", "")

            # Update conversation history
            self.conversation_history.append({"role": "user", "content": user_message})
            self.conversation_history.append({"role": "assistant", "content": assistant_message})

            return assistant_message
        except httpx.HTTPStatusError as e:
            raise Exception(f"Error communicating with Ollama: HTTP {e.response.status_code}")
        except httpx.RequestError as e:
            raise Exception(f"Error communicating with Ollama: {str(e)}")

    def reset(self):
        """Reset conversation history"""
        self.conversation_history = []
        self.is_first_message = True
