FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from orchestrator
COPY orchestrator/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory (orchestrator, vision-analyzer, shared)
COPY . .

ENV PORT=8080
ENV PYTHONPATH=/app
EXPOSE 8080

CMD ["sh", "-c", "uvicorn orchestrator.app.main:app --host 0.0.0.0 --port ${PORT}"]
