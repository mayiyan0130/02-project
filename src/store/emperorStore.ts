import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { calculateNightlyAttendanceProbability } from '../engine/StatFormula';
import type { EmperorMood, EmperorState, PlayerState } from '../types/game';

interface EmperorStore {
  emperor: EmperorState;
  setMood: (mood: EmperorMood) => void;
  adjustSincerity: (delta: number) => void;
  setLastSummonTraceId: (traceId: string) => void;
  calculateNightInterest: (player: PlayerState, timeBonus?: number) => number;
}

const defaultState: EmperorState = {
  mood: '审视',
  sincerity: 42,
  nightlyInterest: 38,
};

export const useEmperorStore = create<EmperorStore>()(
  persist(
    (set, get) => ({
      emperor: defaultState,
      setMood: (mood) => set((state) => ({ emperor: { ...state.emperor, mood } })),
      adjustSincerity: (delta) =>
        set((state) => ({
          emperor: {
            ...state.emperor,
            sincerity: Math.max(0, Math.min(100, state.emperor.sincerity + delta)),
          },
        })),
      setLastSummonTraceId: (traceId) =>
        set((state) => ({ emperor: { ...state.emperor, lastSummonTraceId: traceId } })),
      calculateNightInterest: (player, timeBonus = 0) => {
        const probability = calculateNightlyAttendanceProbability(player, get().emperor, timeBonus);
        set((state) => ({ emperor: { ...state.emperor, nightlyInterest: probability } }));
        return probability;
      },
    }),
    {
      name: 'palace-emperor-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
