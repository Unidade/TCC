"""
Ollama LLM integration for conversation
"""
import requests
from typing import Optional


class OllamaClient:
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "google/gemma-3-4b-it", system_prompt: Optional[str] = None):
        self.base_url = base_url
        self.model = model
        self.system_prompt = system_prompt
        self.conversation_history = []
        self.is_first_message = True

    def chat(self, user_message: str) -> str:
        """
        Send message to Ollama and get response
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
            response = requests.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": False
                },
                timeout=60
            )
            response.raise_for_status()

            result = response.json()
            assistant_message = result.get("message", {}).get("content", "")

            # Update conversation history
            self.conversation_history.append({"role": "user", "content": user_message})
            self.conversation_history.append({"role": "assistant", "content": assistant_message})

            return assistant_message
        except requests.exceptions.RequestException as e:
            raise Exception(f"Error communicating with Ollama: {str(e)}")

    def reset(self):
        """Reset conversation history"""
        self.conversation_history = []
        self.is_first_message = True
