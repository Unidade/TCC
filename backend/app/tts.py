"""
Kokoro TTS integration for Portuguese Brazilian and English
"""
import base64
import io
import wave
import struct
from typing import Tuple


# Kokoro language codes
LANG_CODES = {
    "pt-BR": "p",  # Portuguese
    "en": "a",     # American English
    "en-US": "a",
    "en-GB": "b",  # British English
}

# Default voices per language
DEFAULT_VOICES = {
    "p": "pf_dora",      # Portuguese female
    "a": "af_heart",     # American female
    "b": "bf_emma",      # British female
}

SAMPLE_RATE = 24000


class KokoroTTS:
    def __init__(self, language: str = "pt-BR", voice: str = None):
        """
        Initialize Kokoro TTS

        Args:
            language: Language code ("pt-BR" for Portuguese Brazilian, "en" for English)
            voice: Optional voice name (e.g., "pf_dora", "af_heart")
        """
        self.language = language
        self.lang_code = LANG_CODES.get(language, "p")
        self.voice = voice or DEFAULT_VOICES.get(self.lang_code, "pf_dora")
        
        try:
            from kokoro import KPipeline
            self.pipeline = KPipeline(lang_code=self.lang_code)
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
            Tuple of (wav_bytes, duration_seconds)
        """
        try:
            # Collect all audio chunks from the generator
            audio_chunks = []
            for _, _, audio in self.pipeline(text, voice=self.voice):
                audio_chunks.append(audio)
            
            # Concatenate all audio chunks
            import numpy as np
            full_audio = np.concatenate(audio_chunks) if audio_chunks else np.array([])
            
            # Calculate duration
            duration = len(full_audio) / SAMPLE_RATE
            
            # Convert numpy array to WAV bytes
            wav_bytes = self._numpy_to_wav(full_audio)
            
            return wav_bytes, duration
        except Exception as e:
            raise Exception(f"Error synthesizing speech: {str(e)}")
    
    def _numpy_to_wav(self, audio: 'np.ndarray') -> bytes:
        """Convert numpy audio array to WAV bytes"""
        import numpy as np
        
        # Normalize to int16 range
        audio_int16 = (audio * 32767).astype(np.int16)
        
        # Create WAV in memory
        buffer = io.BytesIO()
        with wave.open(buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(SAMPLE_RATE)
            wav_file.writeframes(audio_int16.tobytes())
        
        return buffer.getvalue()

    def synthesize_to_base64(self, text: str) -> Tuple[str, float]:
        """
        Synthesize speech and return as base64 encoded string

        Returns:
            Tuple of (base64_audio_string, duration_seconds)
        """
        audio_bytes, duration = self.synthesize(text)
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        return audio_base64, duration

    async def synthesize_async(self, text: str) -> Tuple[bytes, float]:
        """
        Async wrapper for synthesize - runs in thread pool to avoid blocking event loop
        """
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.synthesize, text)

    async def synthesize_to_base64_async(self, text: str) -> Tuple[str, float]:
        """
        Async version of synthesize_to_base64 - non-blocking
        """
        audio_bytes, duration = await self.synthesize_async(text)
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        return audio_base64, duration
