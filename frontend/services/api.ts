import {
  ClipResponse,
  LeaderboardResponse,
  LiveMessageRequest,
  LiveMessageResponse,
  Session,
  StartSessionResponse,
  UploadScreenshotResponse
} from "../types/api";

const getApiBase = () => {
  const explicit = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (explicit) return explicit;

  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:8080";
  }
  return "http://localhost:8080";
};

const API_BASE = getApiBase();

import { useUserStore } from "../store/useUserStore";

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const userId = useUserStore.getState().userId;
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(userId ? { "X-User-ID": userId } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function startSession(token?: string): Promise<StartSessionResponse> {
  return request<StartSessionResponse>("/api/session/start", { method: "POST" }, token);
}

export async function endSession(sessionId: string, token?: string): Promise<Session> {
  return request<Session>(`/api/session/${sessionId}/end`, { method: "POST" }, token);
}

export async function uploadScreenshot(sessionId: string, screenshotBase64: string, token?: string): Promise<UploadScreenshotResponse> {
  return request<UploadScreenshotResponse>(
    "/api/upload-screenshot",
    {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, screenshot: screenshotBase64 })
    },
    token
  );
}

export async function sendLiveMessage(payload: LiveMessageRequest, token?: string): Promise<LiveMessageResponse> {
  return request<LiveMessageResponse>(
    "/api/live-message",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function executeAction(sessionId: string, actionId: string, token?: string): Promise<{ success: boolean; details: string }> {
  return request<{ success: boolean; details: string }>(
    `/api/ui-action/execute`,
    {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, action_id: actionId })
    },
    token
  );
}


export async function getSession(sessionId: string, token?: string): Promise<Session> {
  return request<Session>(`/api/session/${sessionId}`, undefined, token);
}

export async function getLeaderboard(limit = 10, token?: string): Promise<LeaderboardResponse> {
  return request<LeaderboardResponse>(`/api/leaderboard?limit=${limit}`, undefined, token);
}

export async function generateClip(
  sessionId: string,
  token?: string,
  options?: { caption?: string; savings?: number }
): Promise<ClipResponse> {
  return request<ClipResponse>(
    "/api/clip/generate",
    {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        caption: options?.caption,
        savings: options?.savings
      })
    },
    token
  );
}

export async function getClipStatus(jobId: string, token?: string): Promise<ClipResponse> {
  return request<ClipResponse>(`/api/clip/status/${jobId}`, undefined, token);
}
