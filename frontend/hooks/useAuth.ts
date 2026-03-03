import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import { firebaseAuth } from "../services/firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  token?: string;
  usingAnonymousFallback: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [usingAnonymousFallback, setUsingAnonymousFallback] = useState(false);

  const refreshToken = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setToken(undefined);
      return;
    }
    const nextToken = await currentUser.getIdToken();
    setToken(nextToken);
  }, []);

  useEffect(() => {
    if (!firebaseAuth) {
      setTimeout(() => {
        setUsingAnonymousFallback(true);
        setLoading(false);
      }, 0);
      return;
    }

    const unsub = onAuthStateChanged(firebaseAuth, async (nextUser) => {
      setUser(nextUser);
      await refreshToken(nextUser);
      setLoading(false);
    });

    return () => unsub();
  }, [refreshToken]);

  useEffect(() => {
    if (!firebaseAuth) {
      return;
    }

    signInAnonymously(firebaseAuth).catch(() => {
      setUsingAnonymousFallback(true);
      setLoading(false);
    });
  }, []);

  return useMemo(
    () => ({ user, loading, token, usingAnonymousFallback }),
    [loading, token, user, usingAnonymousFallback]
  );
}
