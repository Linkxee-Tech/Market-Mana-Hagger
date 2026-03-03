from collections import defaultdict
import json
import logging
from typing import Any
from shared.config import Settings
from shared.models.schemas import PriceAnalysis, ProductDetection
from orchestrator.app.services.gemini_client import GeminiClient
from shared.utils.json_tools import extract_json_payload

logger = logging.getLogger("market_mama.negotiation")

class NegotiationEngine:
    def __init__(self, settings: Settings, gemini_client: GeminiClient):
        self.settings = settings
        self.gemini_client = gemini_client
        # Minimum margin as a percentage (e.g., 0.15 means we won't go below 15% discount on market avg)
        self.min_margin_pct = 0.10 

    @staticmethod
    def _normalize_name(name: str) -> str:
        clean = "".join(c for c in name.lower() if c.isalnum() or c.isspace())
        return " ".join(sorted(clean.split()))

    @staticmethod
    def _normalize_currency(price: float, currency: str) -> float:
        rates = {"USD": 1500, "EUR": 1650, "GBP": 1900, "NGN": 1}
        return price * rates.get(currency.upper(), 1)

    async def analyze(self, products: list[ProductDetection], session_state: dict[str, Any] | None = None) -> PriceAnalysis:
        if not products:
            return PriceAnalysis(
                cheapest_option=0,
                savings=0,
                suggestion="Oya, show me the item make we start the bargaining!"
            )

        # 1. Internal Comparison (Visible on screen)
        cheapest_on_screen = min(products, key=lambda p: self._normalize_currency(p.price, p.currency))
        current_price = self._normalize_currency(cheapest_on_screen.price, cheapest_on_screen.currency)
        
        # 2. External Market Lookup & Strategy
        market_avg = current_price * 0.9  # Default assumption
        mood = "neutral"
        strategy = "hold_firm"

        if self.gemini_client.is_enabled:
            product_list = ", ".join([p.name for p in products[:3]])
            prompt = f"""
            Act as a Nigerian market expert. For these items: {product_list}.
            What is the typical 'fair market' price in Nigeria (NGN) right now?
            User current best price: {current_price} NGN.
            Return ONLY JSON: {{"market_avg": 0, "deal_threshold": 0, "emotion_hint": "neutral|happy|offended"}}
            """
            try:
                text = await self.gemini_client.generate_text(prompt, model=self.settings.gemini_text_model, json_mode=True)
                payload = extract_json_payload(text)
                if payload:
                    market_avg = float(payload.get("market_avg", market_avg))
                    mood = payload.get("emotion_hint", "neutral")
            except Exception as e:
                logger.error(f"Negotiation analysis error: {e}")

        # 3. Decision Logic (The "Haggle" Curve)
        # If current price is more than 20% above market, Mama is aggressive
        # If current price is near market, Mama is "considering"
        # If current price is below market, Mama is "celebrating" but cautious
        
        diff_pct = (current_price - market_avg) / market_avg
        
        if diff_pct > 0.3:
            mood = "urgent"
            suggestion = f"Chei! This price high too much. {current_price} for this? Real price na around {market_avg}. No gree!"
            strategy = "aggressive_cut"
        elif diff_pct > 0.1:
            mood = "thinking"
            suggestion = f"E reach to bargain small. We fit push am go {market_avg}."
            strategy = "soft_negotiation"
        elif diff_pct < -0.05:
            mood = "celebrate"
            suggestion = "Omo, this one na better deal o! Grab am before dem change mind."
            strategy = "accept"
        else:
            mood = "happy"
            suggestion = "The price dey okay, but we fit still try small discount."
            strategy = "gentle_push"

        return PriceAnalysis(
            cheapest_option=round(cheapest_on_screen.price, 2),
            savings=round(max(0, current_price - market_avg), 2),
            suggestion=suggestion,
            metadata={
                "mood": mood,
                "strategy": strategy,
                "market_avg": market_avg
            }
        )

# Maintain alias for compatibility during migration
PriceEngine = NegotiationEngine
