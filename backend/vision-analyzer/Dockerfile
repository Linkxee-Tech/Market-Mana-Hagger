
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (if any)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy root requirements (if exists) or service requirements
COPY backend/vision-analyzer/requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend monorepo to preserve shared imports
COPY backend /app/backend

# Set PYTHONPATH to include backend root
ENV PYTHONPATH=/app/backend

# Expose port
EXPOSE 8080

# Command to run the service
CMD ["uvicorn", "backend.vision-analyzer.vision_analyzer.main:app", "--host", "0.0.0.0", "--port", "8080"]
