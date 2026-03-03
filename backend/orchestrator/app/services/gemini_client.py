import base64
import logging
import time
from google import genai
from google.genai import types

from shared.config import Settings

logger = logging.getLogger("market_mama.gemini")


class GeminiClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = None
        if self.settings.gemini_api_key:
            self.client = genai.Client(api_key=self.settings.gemini_api_key)
        else:
            logger.warning("Gemini API key missing. Gemini features will be disabled.")

    @property
    def is_enabled(self) -> bool:
        return bool(self.client)

    async def generate_text(self, prompt: str, model: str, json_mode: bool = False) -> str:
        if not self.client:
            logger.error("Attempted to generate text without initialized client")
            raise RuntimeError("Gemini Client not initialized")

        start_time = time.perf_counter()
        try:
            config = types.GenerateContentConfig(
                temperature=0.6,
                max_output_tokens=500,
                response_mime_type="application/json" if json_mode else "text/plain"
            )
            
            response = self.client.models.generate_content(
                model=model,
                contents=prompt,
                config=config,
            )
            elapsed = time.perf_counter() - start_time
            logger.info(f"Gemini Text ({model}) successful - {elapsed:.2f}s")
            return response.text or ""
        except Exception as e:
            elapsed = time.perf_counter() - start_time
            logger.error(f"Gemini Text API Error ({model}) after {elapsed:.2f}s: {e}")
            return ""

    async def generate_from_image(self, prompt: str, image_bytes: bytes, mime_type: str, model: str, json_mode: bool = False) -> str:
        if not self.client:
            logger.error("Attempted vision analysis without initialized client")
            raise RuntimeError("Gemini Client not initialized")

        start_time = time.perf_counter()
        try:
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            
            config = types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=800,
                response_mime_type="application/json" if json_mode else "text/plain"
            )

            response = self.client.models.generate_content(
                model=model,
                contents=[prompt, image_part],
                config=config,
            )
            elapsed = time.perf_counter() - start_time
            logger.info(f"Gemini Vision ({model}) successful - {elapsed:.2f}s")
            return response.text or ""
        except Exception as e:
            elapsed = time.perf_counter() - start_time
            logger.error(f"Gemini Vision Error ({model}) after {elapsed:.2f}s: {e}")
            return ""

    async def generate_from_audio(self, prompt: str, audio_bytes: bytes, mime_type: str, model: str) -> str:
        if not self.client:
            logger.error("Attempted audio transcription without initialized client")
            raise RuntimeError("Gemini Client not initialized")

        start_time = time.perf_counter()
        try:
            audio_part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)

            response = self.client.models.generate_content(
                model=model,
                contents=[prompt, audio_part],
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    max_output_tokens=300,
                ),
            )
            elapsed = time.perf_counter() - start_time
            logger.info(f"Gemini Audio ({model}) successful - {elapsed:.2f}s")
            return response.text or ""
        except Exception as e:
            elapsed = time.perf_counter() - start_time
            logger.error(f"Gemini Audio Error ({model}) after {elapsed:.2f}s: {e}")
            return ""
