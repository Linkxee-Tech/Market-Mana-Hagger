# Market-Mama Frontend 💅

This is the Next.js frontend for **Market-Mama Haggler**, a premium real-time bargaining interface.

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + Framer Motion
- **State**: Zustand (Session & UI state)
- **Streaming**: Web Audio API (Live playback) + MediaRecorder (Mic capture)

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configuration**:
   Copy `.env.local` or create it:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🏗 Key Components
- `AudioStreamer.tsx`: Manages bidirectional binary audio streaming.
- `AvatarPanel.tsx`: Reactive UI representing Mama's emotional state.
- `CapturePanel.tsx`: Logic for viewport scanning and Vision API integration.
- `AutoHaggleOverlay.tsx`: Interactive canvas for highlighting UI elements.

## 📦 Deployment
The frontend can be deployed easily on Vercel or any Next.js compatible host. Ensure the `NEXT_PUBLIC_` environment variables are set to point to your live backend.
