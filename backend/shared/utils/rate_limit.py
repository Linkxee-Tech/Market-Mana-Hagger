from __future__ import annotations

import time
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import HTTPException, status


@dataclass
class WindowCounter:
    timestamps: deque[datetime]


class InMemoryRateLimiter:
    def __init__(self, requests_per_minute: int):
        self.requests_per_minute = requests_per_minute
        self._store: dict[str, WindowCounter] = defaultdict(lambda: WindowCounter(deque()))

    def hit(self, key: str, limit: int | None = None) -> None:
        effective_limit = limit or self.requests_per_minute
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(minutes=1)
        counter = self._store[key]

        while counter.timestamps and counter.timestamps[0] < window_start:
            counter.timestamps.popleft()

        if len(counter.timestamps) >= effective_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please retry shortly.",
            )

        counter.timestamps.append(now)


class RedisRateLimiter:
    def __init__(self, redis_url: str, requests_per_minute: int, prefix: str = "mama"):
        import redis

        self.requests_per_minute = requests_per_minute
        self.prefix = prefix
        self._client = redis.Redis.from_url(redis_url, decode_responses=True)
        # Fail fast on startup when Redis is misconfigured.
        self._client.ping()

    def _key(self, key: str) -> str:
        return f"{self.prefix}:ratelimit:{key}"

    def hit(self, key: str, limit: int | None = None) -> None:
        effective_limit = limit or self.requests_per_minute
        now_ms = int(time.time() * 1000)
        window_ms = 60_000
        member = f"{now_ms}-{uuid4().hex[:8]}"
        store_key = self._key(key)

        pipeline = self._client.pipeline(transaction=True)
        pipeline.zremrangebyscore(store_key, 0, now_ms - window_ms)
        pipeline.zcard(store_key)
        pipeline.zadd(store_key, {member: now_ms})
        pipeline.expire(store_key, 120)
        _, current_count, _, _ = pipeline.execute()

        if int(current_count) >= effective_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please retry shortly.",
            )
