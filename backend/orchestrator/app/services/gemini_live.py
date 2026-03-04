from __future__ import annotations
import logging
import asyncio
import base64
from typing import AsyncGenerator, Optional
from shared.config import Settings
from shared.models.schemas import LiveMessageResponse
from .gemini_client import GeminiClient
from .persona_manager import PersonaManager

logger = logging.getLogger("market_mama.live")

class GeminiLiveService:
    def __init__(self, settings: Settings, gemini_client: GeminiClient):
        self.settings = settings
        self.gemini_client = gemini_client
        self.persona_manager = PersonaManager()

    def connect_session(self, persona_id: str = "ibadan"):
        """Returns the Multimodal Live session context manager."""
        if not self.gemini_client.is_enabled:
            logger.error("Gemini client not enabled")
            return None
        
        persona = self.persona_manager.get_persona(persona_id)
        
        try:
            return self.gemini_client.client.models.multimodal_live.connect(
                model=self.settings.gemini_live_model or "gemini-2.0-flash-exp",
                config={
                    "system_instruction": persona.system_prompt,
                    "generation_config": {
                        "response_modalities": ["AUDIO", "TEXT"]
                    }
                }
            )
        except Exception as e:
            logger.error(f"Failed to connect to Gemini Live: {e}")
            return None

    async def respond(self, transcript: str, context: dict, persona_id: str = "ibadan") -> LiveMessageResponse:
        """Text-based response for non-streaming clients."""
        persona = self.persona_manager.get_persona(persona_id)
        prompt = f"{persona.system_prompt}\n\nContext: {context}\nUser said: {transcript}"
        
        text = await self.gemini_client.generate_text(
            prompt=prompt,
            model=self.settings.gemini_text_model,
            json_mode=False
        )
        return LiveMessageResponse(
            speech=text or "I de hear you, my pikin.",
            intent="general",
            confidence=0.8,
            emotion="neutral"
        )
    
    async def transcribe_audio(self, audio_base64: str) -> str:
        """Transcribes incoming audio for text-based flow."""
        audio_bytes = base64.b64decode(audio_base64)
        prompt = "Transcribe this market bargaining audio. Return only the text."
        return await self.gemini_client.generate_from_audio(
            prompt=prompt,
            audio_bytes=audio_bytes,
            mime_type="audio/wav", # Assumed format from frontend
            model=self.settings.gemini_text_model
        )
