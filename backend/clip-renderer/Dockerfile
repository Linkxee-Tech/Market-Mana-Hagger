
FROM python:3.11-slim

WORKDIR /app

# Install FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY backend/clip-renderer/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend /app/backend
ENV PYTHONPATH=/app/backend

EXPOSE 8080

CMD ["uvicorn", "backend.clip-renderer.clip_renderer.main:app", "--host", "0.0.0.0", "--port", "8080"]
