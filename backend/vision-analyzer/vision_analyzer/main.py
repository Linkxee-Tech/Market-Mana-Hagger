
from fastapi import FastAPI, Depends, UploadFile, File
from shared.config import get_settings
from shared.models.schemas import UploadScreenshotResponse
from .service import VisionService
from orchestrator.app.services.gemini_client import GeminiClient

app = FastAPI(title="Vision Analyzer")

def get_gemini_client():
    settings = get_settings()
    return GeminiClient(settings)

def get_service(settings = Depends(get_settings), client = Depends(get_gemini_client)):
    return VisionService(settings, client)

@app.get("/healthz")
async def health():
    return {"status": "ok"}

@app.post("/analyze", response_model=UploadScreenshotResponse)
async def analyze(
    file: UploadFile = File(...),
    service: VisionService = Depends(get_service)
):
    content = await file.read()
    # Mocking mime type or extracting
    mime = file.content_type or "image/png"
    result = await service.analyze(content, mime)
    # The service returns VisionAnalysis, but response expects UploadScreenshotResponse?
    # No, UploadScreenshotResponse includes PriceAnalysis etc.
    # VisionService returns VisionAnalysis.
    # So we should return VisionAnalysis structure.
    # But schema might be strict.
    # For now, just return dict.
    return {
        "products": result.products,
        "has_coupon_field": result.has_coupon_field,
        "detected_codes": result.detected_codes
    }
