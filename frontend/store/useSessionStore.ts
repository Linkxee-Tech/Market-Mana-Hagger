import { create } from 'zustand';
import { Session, UiAction, ProductDetection } from '../types/api';

interface SessionState {
    sessionId: string | null;
    status: 'idle' | 'active' | 'ended';
    currentPrice: number;
    savings: number;
    productList: ProductDetection[];
    actions: UiAction[];
    setSessionId: (id: string | null) => void;
    setStatus: (status: 'idle' | 'active' | 'ended') => void;
    setCurrentPrice: (price: number) => void;
    setSavings: (savings: number) => void;
    setProductList: (list: ProductDetection[]) => void;
    setActions: (actions: UiAction[]) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
    sessionId: null,
    status: 'idle',
    currentPrice: 0,
    savings: 0,
    productList: [],
    actions: [],
    setSessionId: (id) => set({ sessionId: id }),
    setStatus: (status) => set({ status }),
    setCurrentPrice: (price) => set({ currentPrice: price }),
    setSavings: (savings) => set({ savings }),
    setProductList: (list) => set({ productList: list }),
    setActions: (actions) => set({ actions })
}));
