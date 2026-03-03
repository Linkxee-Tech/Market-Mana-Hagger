import { useCallback, useEffect, useMemo, useState } from "react";
import { getLeaderboard } from "../services/api";
import { LeaderboardEntry } from "../types/api";
import { firebaseAuth } from "../services/firebase";

export function useLeaderboard(limit: number = 10) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const getAuthToken = async () => {
    if (!firebaseAuth?.currentUser) return undefined;
    try {
      return await firebaseAuth.currentUser.getIdToken();
    } catch (e) {
      // Log the error for debugging purposes, but return undefined to indicate failure.
      console.error("Failed to get auth token:", e);
      return undefined;
    }
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const token = await getAuthToken();
      const response = await getLeaderboard(limit, token);
      setEntries(response.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(
    () => ({ entries, loading, error, refresh }),
    [entries, error, loading, refresh]
  );
}
