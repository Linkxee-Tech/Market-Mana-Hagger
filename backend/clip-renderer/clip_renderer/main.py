
from fastapi import FastAPI, Depends, HTTPException
from shared.config import get_settings
from .service import ClipRendererService

app = FastAPI(title="Clip Renderer")

def get_service(settings = Depends(get_settings)):
    return ClipRendererService(settings)

@app.get("/healthz")
async def health():
    return {"status": "ok"}

# Internal endpoint for Cloud Tasks worker
@app.post("/internal/clip/process")
async def process_clip_job(
    payload: dict,
    service: ClipRendererService = Depends(get_service)
):
    job_id = payload.get("job_id")
    session_id = payload.get("session_id")
    caption = payload.get("caption")
    savings = payload.get("savings")

    if not job_id or not session_id:
        raise HTTPException(status_code=400, detail="Missing job_id or session_id")

    result = await service.process_job(job_id, session_id, caption, savings)
    return result

@app.get("/clip/{job_id}")
async def get_clip_status(
    job_id: str,
    service: ClipRendererService = Depends(get_service)
):
    return await service.get_status(job_id)
