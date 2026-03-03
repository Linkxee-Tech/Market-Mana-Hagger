"use client";

import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../services/firebase';
import { useUserStore } from '../store/useUserStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUserId } = useUserStore();

    useEffect(() => {
        if (!firebaseAuth) return;

        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            if (user) {
                // Sync Firebase state to Zustand store
                setUserId(user.uid, user.isAnonymous);
                console.log(`[Auth] User synced: ${user.uid} (Anon: ${user.isAnonymous})`);
            } else {
                // No user - the Landing page will handle anonymous sign-in if needed
                // But we should ensure the store is cleared if Firebase says so
                // useUserStore.getState().clearUser(); 
                // Actually, clearing might conflict with the LandingPage init.
                // Let's only clear if it's explicitly null.
                console.log("[Auth] No user session found");
            }
        });

        return () => unsubscribe();
    }, [setUserId]);

    return <>{children}</>;
}
