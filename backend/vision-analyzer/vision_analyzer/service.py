from __future__ import annotations

import asyncio
import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

from shared.config import Settings
from shared.models.schemas import ProductDetection
from orchestrator.app.services.gemini_client import GeminiClient
from shared.utils.json_tools import extract_json_payload

DEFAULT_VISION_PROMPT = """
You are a vision extraction assistant for shopping screenshots.
Return ONLY JSON in this exact schema:
{
  "products": [{"name": "", "price": 0, "currency": "NGN", "coords": [0,0,0,0]}],
  "has_coupon_field": true,
  "detected_codes": ["SAVE10"]
}

Rules:
- Detect products and visible prices.
- Coords format is [x, y, width, height] in screenshot pixel space.
- Currency should be one of NGN, USD, EUR, GBP when identifiable.
- If you are unsure, still return best effort values and non-empty JSON.
""".strip()

VISION_PROMPT_FILE = Path(__file__).resolve().parent.parent / "prompts" / "vision_prompt.txt"


@dataclass
class VisionAnalysis:
    products: list[ProductDetection]
    has_coupon_field: bool
    detected_codes: list[str]


@dataclass
class CachedVisionResult:
    result: VisionAnalysis
    expires_at: datetime


class VisionService:
    def __init__(self, settings: Settings, gemini_client: GeminiClient):
        self.settings = settings
        self.gemini_client = gemini_client
        self._cache: dict[str, CachedVisionResult] = {}
        self._in_flight: dict[str, asyncio.Future[VisionAnalysis]] = {}
        self._lock = asyncio.Lock()
        self.prompt = self._load_prompt()
        self._redis = None
        self._redis_enabled = False

        if settings.redis_url:
            self._try_init_redis()

    def _try_init_redis(self) -> None:
        try:
            import redis

            self._redis = redis.Redis.from_url(self.settings.redis_url or "", decode_responses=True)
            self._redis.ping()
            self._redis_enabled = True
        except Exception:
            self._redis = None
            self._redis_enabled = False

    @staticmethod
    def _load_prompt() -> str:
        try:
            if VISION_PROMPT_FILE.exists():
                text = VISION_PROMPT_FILE.read_text(encoding="utf-8").strip()
                return text or DEFAULT_VISION_PROMPT
            return DEFAULT_VISION_PROMPT
        except Exception:
            return DEFAULT_VISION_PROMPT

    @staticmethod
    def _fingerprint(image_bytes: bytes) -> str:
        return hashlib.sha256(image_bytes).hexdigest()

    def _redis_key(self, key: str) -> str:
        return f"{self.settings.redis_prefix}:vision:{key}"

    def _serialize_vision(self, result: VisionAnalysis) -> str:
        return json.dumps(
            {
                "products": [item.model_dump() for item in result.products],
                "has_coupon_field": result.has_coupon_field,
                "detected_codes": result.detected_codes,
            }
        )

    def _deserialize_vision(self, payload: str) -> VisionAnalysis | None:
        try:
            parsed = json.loads(payload)
            return self._parse_payload(parsed)
        except Exception:
            return None

    def _get_cached(self, key: str) -> VisionAnalysis | None:
        if self._redis_enabled and self._redis:
            raw = self._redis.get(self._redis_key(key))
            if raw:
                redis_cached = self._deserialize_vision(raw)
                if redis_cached:
                    return redis_cached

        cached = self._cache.get(key)
        if not cached:
            return None

        if cached.expires_at < datetime.now(timezone.utc):
            self._cache.pop(key, None)
            return None

        return cached.result

    def _set_cached(self, key: str, result: VisionAnalysis) -> None:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=self.settings.vision_cache_ttl_seconds)
        self._cache[key] = CachedVisionResult(result=result, expires_at=expires_at)
        if self._redis_enabled and self._redis:
            self._redis.setex(
                self._redis_key(key),
                max(1, self.settings.vision_cache_ttl_seconds),
                self._serialize_vision(result),
            )

    def _fallback_result(self) -> VisionAnalysis:
        return VisionAnalysis(
            products=[
                ProductDetection(name="iPhone 14", price=850000, currency="NGN", coords=(120, 180, 260, 90)),
                ProductDetection(name="iPhone 14", price=795000, currency="NGN", coords=(130, 330, 260, 90)),
            ],
            has_coupon_field=True,
            detected_codes=["MAMA10"],
        )

    @staticmethod
    def _parse_payload(payload: dict | list | None) -> VisionAnalysis:
        if not isinstance(payload, dict):
            return VisionAnalysis(products=[], has_coupon_field=False, detected_codes=[])

        raw_products = payload.get("products") or []
        products: list[ProductDetection] = []
        for item in raw_products:
            try:
                coords_tuple = tuple(int(v) for v in item.get("coords", [0, 0, 0, 0]))
                if len(coords_tuple) != 4:
                    coords_tuple = (0, 0, 0, 0)
                coords = (
                    int(coords_tuple[0]),
                    int(coords_tuple[1]),
                    int(coords_tuple[2]),
                    int(coords_tuple[3]),
                )
                products.append(
                    ProductDetection(
                        name=str(item.get("name") or "Unknown item"),
                        price=float(item.get("price") or 0),
                        currency=str(item.get("currency") or "NGN"),
                        coords=coords,
                    )
                )
            except Exception:
                continue

        detected_codes = [str(code) for code in payload.get("detected_codes", [])]

        return VisionAnalysis(
            products=products,
            has_coupon_field=bool(payload.get("has_coupon_field", False)),
            detected_codes=detected_codes,
        )

    async def _analyze_uncached(self, image_bytes: bytes, mime_type: str = "image/png") -> VisionAnalysis:
        if not self.gemini_client.is_enabled:
            return self._fallback_result()

        attempts = [
            self.prompt,
            self.prompt + "\nReturn strict minified JSON only.",
        ]

        for prompt in attempts:
            text = await self.gemini_client.generate_from_image(
                prompt=prompt,
                image_bytes=image_bytes,
                mime_type=mime_type,
                model=self.settings.gemini_vision_model,
                json_mode=True,
            )

            try:
                payload = extract_json_payload(text)
                return self._parse_payload(payload)
            except Exception:
                continue

        return VisionAnalysis(products=[], has_coupon_field=False, detected_codes=[])

    async def analyze(self, image_bytes: bytes, mime_type: str = "image/png") -> VisionAnalysis:
        key = self._fingerprint(image_bytes)

        cached = self._get_cached(key)
        if cached:
            return cached

        async with self._lock:
            cached_again = self._get_cached(key)
            if cached_again:
                return cached_again

            if key in self._in_flight:
                future = self._in_flight[key]
            else:
                loop = asyncio.get_running_loop()
                future = loop.create_future()
                self._in_flight[key] = future

                async def runner() -> None:
                    try:
                        result = await self._analyze_uncached(image_bytes=image_bytes, mime_type=mime_type)
                        self._set_cached(key, result)
                        if not future.done():
                            future.set_result(result)
                    except Exception as exc:
                        if not future.done():
                            future.set_exception(exc)
                    finally:
                        async with self._lock:
                            self._in_flight.pop(key, None)

                asyncio.create_task(runner())

        return await future

