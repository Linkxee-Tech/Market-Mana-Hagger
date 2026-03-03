import { create } from 'zustand';

interface SettingsState {
    theme: 'dark' | 'light';
    language: string;
    autoAnalyze: boolean;
    autoHaggle: boolean;
    selectedPersona: string;
    hasSeenTour: boolean;
    setTheme: (val: 'dark' | 'light') => void;
    setLanguage: (val: string) => void;
    setAutoAnalyze: (val: boolean) => void;
    setAutoHaggle: (val: boolean) => void;
    setSelectedPersona: (val: string) => void;
    setHasSeenTour: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    theme: 'dark',
    language: 'en',
    autoAnalyze: false,
    autoHaggle: false,
    selectedPersona: 'ibadan',
    hasSeenTour: false,
    setTheme: (val) => set({ theme: val }),
    setLanguage: (val) => set({ language: val }),
    setAutoAnalyze: (val) => set({ autoAnalyze: val }),
    setAutoHaggle: (val) => set({ autoHaggle: val }),
    setSelectedPersona: (val) => set({ selectedPersona: val }),
    setHasSeenTour: (val) => set({ hasSeenTour: val })
}));
