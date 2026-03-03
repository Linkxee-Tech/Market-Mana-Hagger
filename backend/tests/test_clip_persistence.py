import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock
from datetime import datetime, timezone
from shared.config import get_settings
from orchestrator.app.services.repository import SessionRepository
from clip_renderer.service import ClipRendererService, ClipJob

@pytest.mark.asyncio
async def test_clip_persistence_flow():
    settings = get_settings()
    # Mock repository to avoid actual DB calls if not configured
    repository = SessionRepository(settings)
    
    # Force in-memory for testing if needed
    service = ClipRendererService(settings, repository)
    
    # Mock _process_job to avoid actual rendering/failures that mess with status assertions
    service._process_job = AsyncMock()
    
    session_id = "test-session-123"
    caption = "Test Clip"
    savings = 50.0
    
    # 1. Request a clip
    result = await service.request_clip(session_id, caption, savings)
    job_id = result.job_id
    
    assert job_id is not None
    assert result.status == "queued"
    
    # 2. Verify it's in the service's memory
    async with service._jobs_lock:
        assert job_id in service._jobs
        
    # 3. Verify it was persisted to the repository
    persisted_job = repository.get_clip_job(job_id)
    assert persisted_job is not None
    assert persisted_job["session_id"] == session_id
    assert persisted_job["caption"] == caption
    assert persisted_job["savings"] == savings

    # 4. Simulate status update and verify
    await service._set_status(job_id, status="processing", progress=50)
    
    # Wait a tiny bit for any potential async side-effects (redundant here but good practice)
    await asyncio.sleep(0.1)
    
    persisted_job_updated = repository.get_clip_job(job_id)
    assert persisted_job_updated["status"] == "processing"
    assert persisted_job_updated["progress"] == 50

    # 5. Wait for the background task to at least finish or be cancelled
    # In a real test we'd await the process, but here we just want to avoid
    # 'Task was destroyed but it is pending'
    await asyncio.sleep(0.5)

@pytest.mark.asyncio
async def test_clip_recovery_from_persistence():
    settings = get_settings()
    repository = SessionRepository(settings)
    service = ClipRendererService(settings, repository)
    
    job_id = "external-job-456"
    job_data = {
        "job_id": job_id,
        "session_id": "sess-789",
        "status": "ready",
        "progress": 100,
        "clip_url": "http://example.com/clip.mp4",
        "error": None,
        "caption": "Recovered Clip",
        "savings": 100.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Manually store in repo
    repository.store_clip_job(job_data)
    
    # Try to get status from service (should trigger recovery from repo)
    result = await service.get_status(job_id)
    
    assert result.status == "ready"
    assert result.clip_url == "http://example.com/clip.mp4"
    
    # Verify it's now in service's memory
    async with service._jobs_lock:
        assert job_id in service._jobs
