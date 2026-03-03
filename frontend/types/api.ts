export type CurrencyCode = "NGN" | "USD" | "EUR" | "GBP" | string;

export interface ProductDetection {
  name: string;
  price: number;
  currency: CurrencyCode;
  coords: [number, number, number, number];
}

export interface VisionResponse {
  products: ProductDetection[];
}

export interface PriceAnalysis {
  cheapest_option: number;
  savings: number;
  suggestion: string;
}

export interface UiAction {
  highlight_coords: [number, number, number, number];
  action_type: "click" | "scroll" | "input" | "none";
  target: string;
  message?: string;
  code?: string;
}

export interface UploadScreenshotResponse {
  products: ProductDetection[];
  analysis: PriceAnalysis;
  ui_actions: UiAction[];
}

export interface LiveMessageRequest {
  session_id: string;
  transcript?: string;
  audio_base64?: string;
  products?: ProductDetection[];
  current_suggestion?: string;
  current_cheapest?: number;
}

export interface LiveMessageResponse {
  speech: string;
  intent: string;
  confidence: number;
  emotion: "neutral" | "hype" | "urgent" | "reassure" | "celebrate";
  next_action?: string;
  ui_actions?: UiAction[];
}

export interface Session {
  id: string;
  user_id: string;
  created_at: string;
  status: "active" | "ended";
  total_savings: number;
}

export interface StartSessionResponse {
  session: Session;
  rtc_config: {
    ice_servers: RTCIceServer[];
  };
}

export interface ClipResponse {
  clip_url?: string;
  status: "queued" | "processing" | "ready" | "missing" | "failed";
  job_id?: string;
  progress?: number;
  error?: string;
}

export interface LeaderboardEntry {
  user_id: string;
  session_id: string;
  total_savings: number;
  created_at: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}

export interface UnifiedWsIncoming {
  type?: string;
  event?: string;
  payload: Record<string, unknown>;
}

