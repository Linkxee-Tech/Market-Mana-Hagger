import { create } from 'zustand';
import { TranscriptEntry } from '../components/TranscriptBox';

interface MamaState {
    lastLine: string;
    mood: 'neutral' | 'hype' | 'urgent' | 'reassure' | 'celebrate' | 'offended' | 'thinking' | 'happy';
    animationTrigger: 'IDLE' | 'LISTENING' | 'SPEAKING' | 'THINKING';
    transcriptEntries: TranscriptEntry[];
    setLastLine: (line: string) => void;
    setMood: (mood: 'neutral' | 'hype' | 'urgent' | 'reassure' | 'celebrate' | 'offended' | 'thinking' | 'happy') => void;
    setAnimationTrigger: (trigger: 'IDLE' | 'LISTENING' | 'SPEAKING' | 'THINKING') => void;
    addTranscriptEntry: (entry: TranscriptEntry) => void;
    setTranscriptEntries: (entries: TranscriptEntry[]) => void;
}

export const useMamaStore = create<MamaState>((set) => ({
    lastLine: '',
    mood: 'neutral',
    animationTrigger: 'IDLE',
    transcriptEntries: [],
    setLastLine: (line) => set({ lastLine: line }),
    setMood: (mood) => set({ mood }),
    setAnimationTrigger: (trigger) => set({ animationTrigger: trigger }),
    addTranscriptEntry: (entry) => set((state) => ({ transcriptEntries: [...state.transcriptEntries, entry] })),
    setTranscriptEntries: (entries) => set({ transcriptEntries: entries })
}));
