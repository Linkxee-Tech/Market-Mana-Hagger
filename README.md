# Market-Mama Haggler 🛒

**Production-grade Real-time Multimodal Bargaining Agent**
*Built with Gemini Multimodal Live, Gemini 2.0 Flash, and Google Cloud.*

## 🚀 Quick Start

Prerequisites
- Google Cloud Project with Billing Enabled
- `gcloud` CLI & Docker
- Gemini API Key (from Google AI Studio)

### Backend Deployment (Cloud Run)

1. **Enable Services**:
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com firestore.googleapis.com
   ```

2. **Deploy**:
   ```bash
   cd backend
   gcloud builds submit --config cloudbuild.yaml .
   ```

3. **Required Environment Variables**:
   - `GEMINI_API_KEY`: Your API Key.
   - `APP_ENV`: `production`
   - `FIRESTORE_PROJECT_ID`: Your GCP Project ID.

### Frontend Deployment (Next.js)

1. Update `.env.production` in `frontend/`:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.run.app
   NEXT_PUBLIC_WS_BASE_URL=wss://your-backend-url.run.app
   ```

2. **Build**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

## 🏗 Modular Architecture

- **Orchestrator**: FastAPI streaming hub managing WebSocket lifecycle.
- **Negotiation Engine**: State-aware strategy layer with emotional response logic.
- **Vision Analyzer**: Real-time product/price extraction using Gemini Flash.
- **Clip Renderer**: Dynamic highlight generation via FFmpeg.
- **Storage**: Firestore for persistent sessions and collective savings logs.

## 🛡 Security & Reliability

- **Structured Output**: AI responses strictly follow JSON schemas.
- **Rate Limiting**: Redis-backed protection for streaming endpoints.
- **Session Integrity**: Ownership-based session guards.
