# FAQ / Help

## Why does Market-Mama ask for mic and screen permissions?
It needs microphone input for live voice coaching and screen capture for price comparison.

## Does the app auto-click checkout buttons?
No. It only suggests actions and highlights targets; user action is always required.

## What if WebSocket disconnects?
The frontend reconnects automatically with backoff and resumes realtime updates.

## Why is clip generation still queued?
Clips are processed asynchronously. Status flow:
- `queued`
- `processing`
- `ready` or `failed`

## Where are clips stored?
By default in Cloud Storage (`gs://<project>-mama-clips/clips/`) when configured.

## Is Redis required locally?
No. Redis is optional in local development; the app falls back to in-memory state.

## Why do I get unauthorized responses?
In production, Firebase auth token is required unless explicit dev bypass is enabled.

## How do I enforce secure websocket usage?
Set frontend to use HTTPS origin and leave `VITE_WS_BASE_URL` empty (auto-derives `wss://`).
