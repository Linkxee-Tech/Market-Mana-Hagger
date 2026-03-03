from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

from shared.config import Settings
from shared.models.schemas import SessionModel


class SessionRepository:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._sessions: dict[str, SessionModel] = {}
        self._savings_logs: list[dict[str, Any]] = []
        self._transactions: list[dict[str, Any]] = []
        self._clip_jobs: dict[str, dict[str, Any]] = {}

        self._firestore = None
        self._firestore_enabled = False
        self._redis = None
        self._redis_enabled = False

        if settings.firestore_project_id:
            self._try_init_firestore()
        if settings.redis_url:
            self._try_init_redis()

    def _try_init_firestore(self) -> None:
        try:
            from google.cloud import firestore

            self._firestore = firestore.Client(project=self.settings.firestore_project_id)
            self._firestore_enabled = True
        except Exception:
            self._firestore = None
            self._firestore_enabled = False

    def _try_init_redis(self) -> None:
        try:
            import redis

            self._redis = redis.Redis.from_url(self.settings.redis_url or "", decode_responses=True)
            self._redis.ping()
            self._redis_enabled = True
        except Exception:
            self._redis = None
            self._redis_enabled = False

    def _redis_key(self, suffix: str) -> str:
        return f"{self.settings.redis_prefix}:{suffix}"

    @staticmethod
    def _serialize_session(session: SessionModel) -> dict[str, Any]:
        return {
            "id": session.id,
            "user_id": session.user_id,
            "created_at": session.created_at.isoformat(),
            "status": session.status,
            "total_savings": session.total_savings,
        }

    @staticmethod
    def _deserialize_session(data: dict[str, Any]) -> SessionModel:
        created_at = data.get("created_at")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)

        if created_at is None:
            created_at = datetime.now(timezone.utc)

        return SessionModel(
            id=str(data["id"]),
            user_id=str(data["user_id"]),
            created_at=created_at,
            status=data.get("status", "active"),
            total_savings=float(data.get("total_savings", 0.0)),
        )

    def _cache_session(self, session: SessionModel) -> None:
        if not self._redis_enabled or not self._redis:
            return
        ttl = max(120, self.settings.session_ttl_minutes * 60)
        key = self._redis_key(f"session:{session.id}")
        self._redis.setex(key, ttl, json.dumps(self._serialize_session(session)))

    def _get_cached_session(self, session_id: str) -> SessionModel | None:
        if not self._redis_enabled or not self._redis:
            return None
        key = self._redis_key(f"session:{session_id}")
        raw = self._redis.get(key)
        if not raw:
            return None
        try:
            payload = json.loads(raw)
            return self._deserialize_session(payload)
        except Exception:
            return None

    def _sync_leaderboard(self, session: SessionModel) -> None:
        if self._redis_enabled and self._redis:
            board_key = self._redis_key("leaderboard:sessions")
            meta_key = self._redis_key(f"session_meta:{session.id}")
            self._redis.zadd(board_key, {session.id: float(session.total_savings)})
            self._redis.hset(
                meta_key,
                mapping={
                    "user_id": session.user_id,
                    "created_at": session.created_at.isoformat(),
                    "total_savings": str(session.total_savings),
                },
            )
            self._redis.expire(meta_key, max(3600, self.settings.session_ttl_minutes * 120))

        if self._firestore_enabled and self._firestore:
            try:
                self._firestore.collection("leaderboard").document(session.id).set(
                    {
                        "session_id": session.id,
                        "user_id": session.user_id,
                        "total_savings": session.total_savings,
                        "created_at": session.created_at,
                    },
                    merge=True,
                )
            except Exception as e:
                print(f"Firestore leaderboard sync failed: {e}")

    def create_session(self, user_id: str) -> SessionModel:
        session = SessionModel(
            id=str(uuid4()),
            user_id=user_id,
            created_at=datetime.now(timezone.utc),
            status="active",
            total_savings=0,
        )

        self._sessions[session.id] = session
        self._cache_session(session)
        self._sync_leaderboard(session)

        if self._firestore_enabled and self._firestore:
            try:
                self._firestore.collection("sessions").document(session.id).set(self._serialize_session(session))
                self._firestore.collection("users").document(user_id).set(
                    {
                        "user_id": user_id,
                        "updated_at": datetime.now(timezone.utc),
                    },
                    merge=True,
                )
            except Exception as e:
                print(f"Firestore session creation failed: {e}")

        return session

    def get_session(self, session_id: str) -> SessionModel | None:
        if session_id in self._sessions:
            return self._sessions[session_id]

        cached = self._get_cached_session(session_id)
        if cached:
            self._sessions[session_id] = cached
            return cached

        if self._firestore_enabled and self._firestore:
            doc = self._firestore.collection("sessions").document(session_id).get()
            if not doc.exists:
                return None

            session = self._deserialize_session(doc.to_dict() or {})
            self._sessions[session_id] = session
            self._cache_session(session)
            self._sync_leaderboard(session)
            return session

        return None

    def end_session(self, session_id: str) -> SessionModel | None:
        session = self.get_session(session_id)
        if not session:
            return None

        session.status = "ended"
        self._sessions[session_id] = session
        self._cache_session(session)
        self._sync_leaderboard(session)

        if self._firestore_enabled and self._firestore:
            self._firestore.collection("sessions").document(session_id).set(
                {"status": "ended"},
                merge=True,
            )

        return session

    def update_session_savings(self, session_id: str, savings: float) -> SessionModel | None:
        session = self.get_session(session_id)
        if not session:
            return None

        if savings > session.total_savings:
            session.total_savings = savings

        self._sessions[session_id] = session
        self._cache_session(session)
        self._sync_leaderboard(session)

        if self._firestore_enabled and self._firestore:
            try:
                self._firestore.collection("sessions").document(session_id).set(self._serialize_session(session), merge=True)
            except Exception as e:
                print(f"Firestore session savings update failed: {e}")

        return session

    def log_savings(self, session_id: str, user_id: str, savings: float, metadata: dict[str, Any] | None = None) -> None:
        payload = {
            "id": str(uuid4()),
            "session_id": session_id,
            "user_id": user_id,
            "savings": savings,
            "metadata": metadata or {},
            "timestamp": datetime.now(timezone.utc),
        }
        self._savings_logs.append(payload)

        if self._firestore_enabled and self._firestore:
            self._firestore.collection("savings_logs").document(payload["id"]).set(payload)

    def record_transaction(self, session_id: str, user_id: str, transaction_type: str, payload: dict[str, Any]) -> None:
        item = {
            "id": str(uuid4()),
            "session_id": session_id,
            "user_id": user_id,
            "type": transaction_type,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc),
        }
        self._transactions.append(item)

        if self._firestore_enabled and self._firestore:
            self._firestore.collection("transactions").document(item["id"]).set(item)

    def store_clip_job(self, job_data: dict[str, Any]) -> None:
        """Persist clip job state to Memory/Redis/Firestore."""
        job_id = job_data["job_id"]
        
        # 1. Update In-Memory Cache
        self._clip_jobs[job_id] = job_data
        
        # 2. Redis Cache (for fast polling)
        if self._redis_enabled and self._redis:
            key = self._redis_key(f"clip:{job_id}")
            # Expire after 24 hours
            self._redis.setex(key, 86400, json.dumps(job_data))

        # 3. Firestore (Long-term)
        if self._firestore_enabled and self._firestore:
            self._firestore.collection("clips").document(job_id).set(job_data, merge=True)

    def get_clip_job(self, job_id: str) -> dict[str, Any] | None:
        """Retrieve clip job state."""
        # 0. Try Memory
        if job_id in self._clip_jobs:
            return self._clip_jobs[job_id]
        
        # 1. Try Redis
        if self._redis_enabled and self._redis:
            key = self._redis_key(f"clip:{job_id}")
            raw = self._redis.get(key)
            if raw:
                try:
                    return json.loads(raw)
                except Exception:
                    pass

        # 2. Try Firestore
        if self._firestore_enabled and self._firestore:
            doc = self._firestore.collection("clips").document(job_id).get()
            if doc.exists:
                return doc.to_dict()

        return None

    @staticmethod
    def _within_window(created_at: datetime, window: str) -> bool:
        if window == "all":
            return True
        now = datetime.now(timezone.utc)
        delta = now - created_at
        if window == "24h":
            return delta <= timedelta(hours=24)
        if window == "7d":
            return delta <= timedelta(days=7)
        if window == "30d":
            return delta <= timedelta(days=30)
        return True

    def get_top_savers(self, limit: int = 10, window: str = "all") -> list[dict[str, Any]]:
        # For simplicity and consistency in the manual demo, we'll aggregate from all sessions
        # and group by user_id, taking their best session savings score.

        user_best: dict[str, dict[str, Any]] = {}
        
        # 1. Gather all candidate sessions based on window
        candidates = []
        if self._firestore_enabled and self._firestore:
            try:
                # Simplification: Fetch sessions from Firestore if enabled
                docs = self._firestore.collection("leaderboard").stream()
                for doc in docs:
                    data = doc.to_dict() or {}
                    candidates.append(data)
            except Exception as e:
                print(f"Firestore leaderboard fetch failed: {e}")
        else:
            # Use in-memory sessions
            for s in self._sessions.values():
                candidates.append({
                    "user_id": s.user_id,
                    "session_id": s.id,
                    "total_savings": s.total_savings,
                    "created_at": s.created_at
                })

        # 2. Filter by window and aggregate by user_id (Max savings)
        for data in candidates:
            uid = data.get("user_id")
            if not uid: continue
            
            created_at = data.get("created_at")
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at)
            
            if not self._within_window(created_at, window):
                continue
            
            savings = float(data.get("total_savings") or 0)
            
            if uid not in user_best or savings > user_best[uid]["total_savings"]:
                user_best[uid] = {
                    "user_id": uid,
                    "session_id": data.get("session_id") or "agg",
                    "total_savings": savings,
                    "created_at": created_at
                }
        
        # 3. Sort and limit
        results = sorted(
            user_best.values(),
            key=lambda x: x["total_savings"],
            reverse=True
        )
        
        return results[:limit]
