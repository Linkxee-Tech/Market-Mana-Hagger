import { useCallback, useMemo, useState } from "react";
import { sendLiveMessage } from "../services/api";
import { LiveMessageRequest, LiveMessageResponse } from "../types/api";

export function useLiveVoice(sessionId?: string, token?: string) {
  const [response, setResponse] = useState<LiveMessageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const sendTranscript = useCallback(
    async (payload: Omit<LiveMessageRequest, "session_id">) => {
      if (!sessionId) {
        throw new Error("No active session");
      }
      setLoading(true);
      setError(undefined);
      try {
        const result = await sendLiveMessage({ session_id: sessionId, ...payload }, token);
        setResponse(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to reach live agent";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sessionId, token]
  );

  return useMemo(
    () => ({ response, loading, error, sendTranscript }),
    [error, loading, response, sendTranscript]
  );
}
