# Market-Mama Backend 🐍

This is the modular monolith backend for **Market-Mama Haggler**, providing real-time negotiation intelligence and multimodal AI processing.

## 🛠 Tech Stack
- **Full-Web Framework**: FastAPI (Asynchronous)
- **AI Integration**: Google GenAI SDK (Multimodal Live API)
- **Persistence**: Firestore + Redis
- **Processing**: FFmpeg (Clip rendering)

## 🚀 Getting Started

1. **Virtual Environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configuration**:
   Copy `.env.example` to `.env` and fill in:
   - `GEMINI_API_KEY`
   - `FIRESTORE_PROJECT_ID`
   - `REDIS_URL`

4. **Run Server**:
   ```bash
   uvicorn orchestrator.app.main:app --reload --port 8080
   ```

## 🏗 Modular Services
- `orchestrator/`: Gateway managing WebSockets and orchestration.
- `price-intelligence/`: Strategy engine and market price normalization.
- `vision-analyzer/`: Product detection using Gemini Vision.
- `clip-renderer/`: Background task for generating session highlights.
- `shared/`: Common models, schemas, and utility functions.

## 🧪 Testing
Run tests using pytest:
```bash
pytest backend/tests
```
