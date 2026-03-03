from __future__ import annotations

import asyncio
import json
import subprocess
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from uuid import uuid4

from shared.config import Settings


JobStatus = Literal["queued", "processing", "ready", "failed"]


@dataclass
class ClipJob:
    job_id: str
    session_id: str
    status: JobStatus
    progress: int
    clip_url: str | None
    error: str | None
    caption: str | None
    savings: float | None
    created_at: datetime


@dataclass
class ClipResult:
    status: str
    progress: int
    clip_url: str | None
    job_id: str
    error: str | None = None


class ClipRendererService:
    def __init__(self, settings: Settings, repository: SessionRepository | None = None):
        self.settings = settings
        self.repository = repository
        self._jobs: dict[str, ClipJob] = {}
        self._jobs_lock = asyncio.Lock()
        self._storage_client = None
        self._tasks_client = None
        self._tmp_dir = Path(tempfile.gettempdir()) / "market_mama_clips"
        self._tmp_dir.mkdir(parents=True, exist_ok=True)
        self._try_init_clients()

    def _try_init_clients(self) -> None:
        try:
            from google.cloud import storage

            self._storage_client = storage.Client() if self.settings.gcs_bucket else None
        except Exception:
            self._storage_client = None

        try:
            from google.cloud import tasks_v2

            self._tasks_client = tasks_v2.CloudTasksClient()
        except Exception:
            self._tasks_client = None

    def _build_clip_url(self, job_id: str) -> str | None:
        base_url = self.settings.clip_base_url
        if not base_url and self.settings.gcs_bucket:
            base_url = f"https://storage.googleapis.com/{self.settings.gcs_bucket}/clips"
        return f"{base_url}/{job_id}.mp4" if base_url else None

    @staticmethod
    def _escape_drawtext(text: str) -> str:
        return (
            text.replace("\\", "\\\\")
            .replace(":", "\\:")
            .replace("'", "\\'")
            .replace("%", "\\%")
            .replace("[", "\\[")
            .replace("]", "\\]")
        )

    async def _set_status(
        self,
        job_id: str,
        *,
        status: JobStatus,
        progress: int,
        clip_url: str | None = None,
        error: str | None = None,
    ) -> None:
        async with self._jobs_lock:
            job = self._jobs.get(job_id)
            if not job:
                # If not in memory but we have repository, maybe we can fetch it?
                if self.repository:
                    raw_job = await asyncio.to_thread(self.repository.get_clip_job, job_id)
                    if raw_job:
                        # Reconstruct job in memory
                        job = ClipJob(
                            job_id=job_id,
                            session_id=raw_job["session_id"],
                            status=raw_job["status"],
                            progress=raw_job["progress"],
                            clip_url=raw_job["clip_url"],
                            error=raw_job["error"],
                            caption=raw_job.get("caption"),
                            savings=raw_job.get("savings"),
                            created_at=datetime.fromisoformat(raw_job["created_at"]),
                        )
                        self._jobs[job_id] = job
            
            if not job:
                return

            job.status = status
            job.progress = max(0, min(100, progress))
            if clip_url is not None:
                job.clip_url = clip_url
            if error is not None:
                job.error = error
        
        if self.repository:
            await self.persist_job(self.repository, job_id)

    async def persist_job(self, repository, job_id: str) -> None:
        """Helper to sync current memory state to repository."""
        async with self._jobs_lock:
            job = self._jobs.get(job_id)
            if not job:
                return
            
            payload = {
                "job_id": job.job_id,
                "session_id": job.session_id,
                "status": job.status,
                "progress": job.progress,
                "clip_url": job.clip_url,
                "error": job.error,
                "caption": job.caption,
                "savings": job.savings,
                "created_at": job.created_at.isoformat(),
            }
        
        # Run sync in thread or await if repository supported async?
        # Repository methods are synchronous (using blocking generic libs or just sync primitives).
        # We'll run in thread to be safe.
        await asyncio.to_thread(repository.store_clip_job, payload)

    def _enqueue_cloud_task(self, job: ClipJob) -> bool:
        if not self._tasks_client:
            return False
        if not self.settings.clip_worker_url:
            return False

        project_id = self.settings.clip_tasks_project_id or self.settings.firestore_project_id
        if not project_id:
            return False

        try:
            from google.cloud import tasks_v2

            queue_path = self._tasks_client.queue_path(
                project_id,
                self.settings.clip_tasks_location,
                self.settings.clip_tasks_queue,
            )
            url = self.settings.clip_worker_url.rstrip("/") + "/internal/clip/process"
            payload = {
                "job_id": job.job_id,
                "session_id": job.session_id,
                "caption": job.caption,
                "savings": job.savings,
            }
            headers = {"Content-Type": "application/json"}
            if self.settings.clip_worker_token:
                headers["X-Clip-Worker-Token"] = self.settings.clip_worker_token

            request_payload: dict = {
                "http_method": tasks_v2.HttpMethod.POST,
                "url": url,
                "headers": headers,
                "body": json.dumps(payload).encode("utf-8"),
            }
            if self.settings.clip_tasks_service_account:
                request_payload["oidc_token"] = {
                    "service_account_email": self.settings.clip_tasks_service_account,
                    "audience": url,
                }

            task = {"http_request": request_payload}
            self._tasks_client.create_task(parent=queue_path, task=task)
            return True
        except Exception:
            return False

    def _run_ffmpeg(self, output_path: Path, caption: str | None, savings: float | None) -> None:
        headline = caption or "Market-Mama Haggler"
        savings_line = (
            f"Savings: {round(float(savings), 2)}"
            if isinstance(savings, (int, float))
            else "Savings: Keep haggling"
        )

        escaped_headline = self._escape_drawtext(headline)
        escaped_savings = self._escape_drawtext(savings_line)
        # Premium Gradient Background + Watermark + Better Text
        # We use vignette for a depth effect and better typography.
        draw_filter = (
            f"drawtext=text='{escaped_headline}':x=(w-text_w)/2:y=h/2-60:fontsize=64:fontcolor=white:fontfile=Arial:shadowcolor=black@0.5:shadowx=4:shadowy=4,"
            f"drawtext=text='{escaped_savings}':x=(w-text_w)/2:y=h/2+40:fontsize=48:fontcolor=0x10b981:fontfile=Arial:shadowcolor=black@0.5:shadowx=3:shadowy=3,"
            "drawtext=text='Market-Mama Haggler AI':x=w-tw-40:y=h-th-40:fontsize=24:fontcolor=white@0.3:fontfile=Arial"
        )

        duration = max(5, int(self.settings.clip_duration_seconds))
        size = f"{self.settings.clip_width}x{self.settings.clip_height}"
        
        # Use a more complex filter graph for a premium look
        # 1. Base color 2. Vignette for depth 3. Text overlays
        vf_chain = f"vignette=angle=0.5, {draw_filter}"

        command = [
            self.settings.ffmpeg_binary,
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"color=c=0x0a0a0a:s={size}:d={duration}",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=520:duration={duration}",
            "-vf",
            vf_chain,
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-preset",
            "fast",
            "-c:a",
            "aac",
            "-shortest",
            str(output_path),
        ]

        try:
            subprocess.run(command, capture_output=True, check=True, text=True)
            return
        except Exception:
            # Fallback when drawtext/filter/font support is unavailable.
            fallback_command = [
                self.settings.ffmpeg_binary,
                "-y",
                "-f",
                "lavfi",
                "-i",
                f"testsrc=size={size}:rate=30:duration={duration}",
                "-f",
                "lavfi",
                "-i",
                f"sine=frequency=520:duration={duration}",
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                "-shortest",
                str(output_path),
            ]
            subprocess.run(fallback_command, capture_output=True, check=True, text=True)

    def _upload_to_storage(self, output_path: Path, job_id: str) -> str | None:
        if not self._storage_client or not self.settings.gcs_bucket:
            return None

        try:
            bucket = self._storage_client.bucket(self.settings.gcs_bucket)
            blob = bucket.blob(f"clips/{job_id}.mp4")
            blob.cache_control = "public, max-age=3600"
            blob.upload_from_filename(str(output_path), content_type="video/mp4")
            return f"https://storage.googleapis.com/{self.settings.gcs_bucket}/clips/{job_id}.mp4"
        except Exception:
            return None

    async def _process_job(self, job_id: str) -> None:
        async with self._jobs_lock:
            job = self._jobs.get(job_id)
            if not job:
                return

        await self._set_status(job_id, status="processing", progress=25)
        output_path = self._tmp_dir / f"{job_id}.mp4"

        try:
            await asyncio.to_thread(self._run_ffmpeg, output_path, job.caption, job.savings)
            clip_url = self._upload_to_storage(output_path, job_id) or self._build_clip_url(job_id)
            if not clip_url:
                clip_url = str(output_path)
            await self._set_status(job_id, status="ready", progress=100, clip_url=clip_url)
        except Exception as exc:
            await self._set_status(job_id, status="failed", progress=100, error=str(exc))

    async def request_clip(self, session_id: str, caption: str | None = None, savings: float | None = None) -> ClipResult:
        job_id = str(uuid4())
        clip_url = self._build_clip_url(job_id)

        job = ClipJob(
            job_id=job_id,
            session_id=session_id,
            status="queued",
            progress=5,
            clip_url=clip_url,
            error=None,
            caption=caption,
            savings=savings,
            created_at=datetime.now(timezone.utc),
        )

        async with self._jobs_lock:
            self._jobs[job_id] = job

        if self.repository:
            await self.persist_job(self.repository, job_id)

        if not self._enqueue_cloud_task(job):
            asyncio.create_task(self._process_job(job_id))

        return ClipResult(status=job.status, progress=job.progress, clip_url=job.clip_url, job_id=job.job_id, error=None)

    async def process_job(self, job_id: str, session_id: str, caption: str | None = None, savings: float | None = None) -> ClipResult:
        async with self._jobs_lock:
            if job_id not in self._jobs:
                self._jobs[job_id] = ClipJob(
                    job_id=job_id,
                    session_id=session_id,
                    status="queued",
                    progress=1,
                    clip_url=self._build_clip_url(job_id),
                    error=None,
                    caption=caption,
                    savings=savings,
                    created_at=datetime.now(timezone.utc),
                )
            else:
                self._jobs[job_id].caption = caption or self._jobs[job_id].caption
                self._jobs[job_id].savings = savings if savings is not None else self._jobs[job_id].savings

        await self._process_job(job_id)
        return await self.get_status(job_id)

    async def get_status(self, job_id: str) -> ClipResult:
        async with self._jobs_lock:
            job = self._jobs.get(job_id)
            if not job:
                # Try to recover from repository
                if self.repository:
                    raw_job = await asyncio.to_thread(self.repository.get_clip_job, job_id)
                    if raw_job:
                        job = ClipJob(
                            job_id=job_id,
                            session_id=raw_job["session_id"],
                            status=raw_job["status"],
                            progress=raw_job["progress"],
                            clip_url=raw_job["clip_url"],
                            error=raw_job["error"],
                            caption=raw_job.get("caption"),
                            savings=raw_job.get("savings"),
                            created_at=datetime.fromisoformat(raw_job["created_at"]),
                        )
                        self._jobs[job_id] = job

            if not job:
                return ClipResult(status="missing", progress=0, clip_url=None, job_id=job_id, error=None)
            return ClipResult(
                status=job.status,
                progress=job.progress,
                clip_url=job.clip_url,
                job_id=job.job_id,
                error=job.error,
            )
