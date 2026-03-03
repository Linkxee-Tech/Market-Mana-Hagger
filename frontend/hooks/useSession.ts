import { useCallback, useMemo, useState } from "react";
import { endSession, getSession, startSession } from "../services/api";
import { Session, StartSessionResponse } from "../types/api";
import { firebaseAuth } from "../services/firebase";
import { useSessionStore } from "../store/useSessionStore";

export function useSession() {
  const { setSessionId, setStatus } = useSessionStore();
  const [session, setSession] = useState<Session | null>(null);
  const [rtcConfig, setRtcConfig] = useState<StartSessionResponse["rtc_config"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const getAuthToken = async () => {
    if (!firebaseAuth?.currentUser) return undefined;
    try {
      return await firebaseAuth.currentUser.getIdToken();
    } catch (e) {
      console.warn("Failed to get auth token", e);
      return undefined;
    }
  };

  const beginSession = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const token = await getAuthToken();
      const result = await startSession(token);
      setSession(result.session);
      setSessionId(result.session.id);
      setRtcConfig(result.rtc_config);
      return result;
    } catch (err) {
      console.error("[useSession] beginSession failed:", err);
      setError(err instanceof Error ? err.message : "Failed to start session");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setSessionId]);

  const loadSessionById = useCallback(
    async (sessionId: string) => {
      setLoading(true);
      setError(undefined);
      try {
        const token = await getAuthToken();
        const nextSession = await getSession(sessionId, token);
        setSession(nextSession);
        return nextSession;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refreshSession = useCallback(async () => {
    if (!session?.id) {
      return null;
    }
    try {
      const token = await getAuthToken();
      const nextSession = await getSession(session.id, token);
      setSession(nextSession);
      return nextSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch session");
      return null;
    }
  }, [session?.id]);

  const stopSession = useCallback(async () => {
    if (!session?.id) {
      return null;
    }
    try {
      const token = await getAuthToken();
      const ended = await endSession(session.id, token);
      setSession(ended);
      setStatus('ended');
      setSessionId(null);
      return ended;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end session");
      return null;
    }
  }, [session?.id]);

  return useMemo(
    () => ({
      session,
      rtcConfig,
      loading,
      error,
      beginSession,
      loadSessionById,
      refreshSession,
      stopSession,
      setSession
    }),
    [beginSession, error, loading, loadSessionById, refreshSession, rtcConfig, session, stopSession]
  );
}
