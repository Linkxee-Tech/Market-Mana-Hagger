# Architecture Diagram

```mermaid
flowchart LR
  U[User Browser]
  FE[Frontend React App]
  ORCH[mama-orchestrator<br/>Cloud Run]
  VSN[mama-vision<br/>Cloud Run]
  CLIP[mama-clip-worker<br/>Cloud Run]
  GEMTXT[Gemini Text API]
  GEMVIS[Gemini Vision API]
  FS[(Firestore)]
  REDIS[(Memorystore Redis)]
  GCS[(Cloud Storage)]
  TASKS[(Cloud Tasks)]
  MON[Cloud Monitoring/Alerts]

  U --> FE
  FE <-->|REST + WS| ORCH
  FE -->|Screen share/screenshot| ORCH
  ORCH --> VSN
  ORCH --> GEMTXT
  VSN --> GEMVIS
  ORCH --> FS
  ORCH --> REDIS
  VSN --> REDIS
  ORCH --> TASKS
  TASKS --> CLIP
  CLIP --> GCS
  ORCH --> GCS
  ORCH --> MON
  VSN --> MON
  CLIP --> MON
```

## Notes
- Unified realtime protocol is on `WS /ws/{sessionId}`.
- Legacy WS channels remain available for compatibility:
  - `/ws/sessions/{sessionId}`
  - `/ws/live/{sessionId}`
- Clip pipeline supports:
  - Async queue dispatch via Cloud Tasks
  - FFmpeg rendering
  - Upload to GCS with public clip URLs
