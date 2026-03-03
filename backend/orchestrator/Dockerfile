FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (e.g., ffmpeg for audio/video processing if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/orchestrator/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory to support cross-service and shared imports
COPY backend /app/backend

# Set working directory to the service directory
WORKDIR /app/backend/orchestrator

# Cloud Run defaults: Port 8080
ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
