import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
    userId: string | null;
    isAnonymous: boolean;
    micPermission: boolean;
    screenPermission: boolean;
    muted: boolean;
    micActive: boolean;
    _hasHydrated: boolean;
    setUserId: (id: string | null, isAnon?: boolean) => void;
    setMicPermission: (val: boolean) => void;
    setScreenPermission: (val: boolean) => void;
    setMuted: (val: boolean) => void;
    setMicActive: (val: boolean) => void;
    setHasHydrated: (val: boolean) => void;
    clearUser: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            userId: null,
            isAnonymous: true,
            micPermission: false,
            screenPermission: false,
            muted: false,
            micActive: false,
            _hasHydrated: false,
            setUserId: (id, isAnon = true) => set({ userId: id, isAnonymous: isAnon }),
            setMicPermission: (val) => set({ micPermission: val }),
            setScreenPermission: (val) => set({ screenPermission: val }),
            setMuted: (val) => set({ muted: val }),
            setMicActive: (val) => set({ micActive: val }),
            setHasHydrated: (val) => set({ _hasHydrated: val }),
            clearUser: () => set({ userId: null, isAnonymous: true }),
        }),
        {
            name: 'market-mama-user-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
