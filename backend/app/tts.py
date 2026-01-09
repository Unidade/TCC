"""
Kokoro TTS integration for Portuguese Brazilian and English
"""
import base64
import io
import wave
from typing import Tuple, Optional


class KokoroTTS:
    def __init__(self, language: str = "pt-BR"):
        """
        Initialize Kokoro TTS

        Args:
            language: Language code ("pt-BR" for Portuguese Brazilian, "en" for English)
        """
        self.language = language
        try:
            from kokoro import Kokoro
            self.kokoro = Kokoro()
        except ImportError:
            raise ImportError(
                "Kokoro TTS not installed. Install with: pip install kokoro"
            )

    def synthesize(self, text: str) -> Tuple[bytes, float]:
        """
        Synthesize speech from text

        Args:
            text: Text to synthesize

        Returns:
            Tuple of (audio_bytes, duration_seconds)
        """
        try:
            # Generate audio using Kokoro
            # Try different API patterns based on Kokoro version
            if hasattr(self.kokoro, 'generate'):
                audio_data = self.kokoro.generate(text, language=self.language)
            elif hasattr(self.kokoro, 'tts'):
                audio_data = self.kokoro.tts(text, language=self.language)
            else:
                # Fallback: try calling directly
                audio_data = self.kokoro(text, language=self.language)

            # Ensure we have bytes
            if isinstance(audio_data, str):
                audio_data = audio_data.encode('latin-1')

            # Get duration from audio data
            audio_io = io.BytesIO(audio_data)
            try:
                with wave.open(audio_io, 'rb') as wav_file:
                    frames = wav_file.getnframes()
                    sample_rate = wav_file.getframerate()
                    duration = frames / float(sample_rate)
            except Exception:
                # If wave parsing fails, estimate duration (rough: ~150 words per minute)
                words = len(text.split())
                duration = (words / 150) * 60

            return audio_data, duration
        except Exception as e:
            raise Exception(f"Error synthesizing speech: {str(e)}")

    def synthesize_to_base64(self, text: str) -> Tuple[str, float]:
        """
        Synthesize speech and return as base64 encoded string

        Returns:
            Tuple of (base64_audio_string, duration_seconds)
        """
        audio_bytes, duration = self.synthesize(text)
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        return audio_base64, duration
