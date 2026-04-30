import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { advanceTime, createInitialGameTime } from '../engine/TimeEngine';
import type { GameTime, MapLocation, SaveSnapshot } from '../types/game';

interface GameStore {
  location: MapLocation;
  time: GameTime;
  latestSave?: SaveSnapshot;
  moveTo: (location: MapLocation) => void;
  tickTime: (steps?: number) => void;
  saveGame: (snapshot: SaveSnapshot) => void;
  loadGame: (snapshot: SaveSnapshot) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      location: '寝宫',
      time: createInitialGameTime(),
      latestSave: undefined,
      moveTo: (location) => set({ location }),
      tickTime: (steps = 1) => set((state) => ({ time: advanceTime(state.time, steps) })),
      saveGame: (snapshot) => set({ latestSave: snapshot }),
      loadGame: (snapshot) =>
        set({
          latestSave: snapshot,
          location: snapshot.location,
          time: snapshot.time,
        }),
    }),
    {
      name: 'palace-game-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
