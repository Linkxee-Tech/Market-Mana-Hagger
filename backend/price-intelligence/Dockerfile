
FROM python:3.11-slim

WORKDIR /app

COPY backend/price-intelligence/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend /app/backend
ENV PYTHONPATH=/app/backend

EXPOSE 8080

CMD ["uvicorn", "backend.price-intelligence.price_intelligence.main:app", "--host", "0.0.0.0", "--port", "8080"]
