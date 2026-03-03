# Deployment Guide (Staging -> Production)

## 1. Prerequisites
- Google Cloud project with billing enabled
- APIs enabled:
  - Cloud Run
  - Cloud Build
  - Cloud Tasks
  - Firestore
  - Memorystore (Redis)
  - Secret Manager
  - Cloud Storage
  - Monitoring
- Artifact Registry repository created

## 2. Configure Secrets
- Create `market-mama-gemini-api-key` in Secret Manager.
- Store the Gemini API key as the latest version.
- Generate a secure `CLIP_WORKER_TOKEN`.

## 3. Provision Infrastructure
From `infrastructure/terraform`:
```bash
terraform init
terraform plan \
  -var="project_id=YOUR_PROJECT_ID" \
  -var="allowed_origins=https://your-frontend-domain" \
  -var="image_orchestrator=us-central1-docker.pkg.dev/YOUR_PROJECT_ID/market-mama/mama-orchestrator:latest" \
  -var="image_vision=us-central1-docker.pkg.dev/YOUR_PROJECT_ID/market-mama/mama-vision:latest" \
  -var="image_clip_worker=us-central1-docker.pkg.dev/YOUR_PROJECT_ID/market-mama/mama-clip-worker:latest" \
  -var="gemini_api_key_value=REDACTED" \
  -var="clip_worker_token=REDACTED" \
  -var="redis_authorized_network=projects/YOUR_PROJECT_ID/global/networks/default"
terraform apply
```

## 4. CI/CD Pipeline
- Use `cloudbuild.yaml` to:
  - Run backend tests
  - Build frontend assets
  - Build and push all backend service images
  - Deploy orchestrator, vision, and clip-worker services

Trigger strategy:
- Staging: run on `staging` branch push.
- Production: run on `main` branch merge + manual approval.

## 5. Firestore Security and Indexes
- Deploy rules from `infrastructure/firestore/firestore.rules`.
- Deploy indexes from `infrastructure/firestore/firestore.indexes.json`.

## 6. Production Checks
- Verify CORS origin list contains only production frontend domains.
- Verify `ALLOW_DEV_AUTH_BYPASS=false`.
- Verify `VITE_WS_BASE_URL` is empty or set to `wss://...`.
- Verify Cloud Tasks can reach `/internal/clip/process` with `X-Clip-Worker-Token`.
- Verify Redis connectivity from Cloud Run.
- Verify clip uploads in `gs://<project>-mama-clips/clips/`.

## 7. Rollback
- Roll back Cloud Run revisions using:
```bash
gcloud run services update-traffic mama-orchestrator --to-revisions REVISION=100 --region us-central1
gcloud run services update-traffic mama-vision --to-revisions REVISION=100 --region us-central1
gcloud run services update-traffic mama-clip-worker --to-revisions REVISION=100 --region us-central1
```
