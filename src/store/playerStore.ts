import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { OPENING_ROUTE_MAP } from '../config/initialData';
import { RANK_BY_ID } from '../config/ranks';
import type { CalcAgentResponse, OpeningRouteId, PlayerState } from '../types/game';

interface PlayerStore {
  player: PlayerState;
  bootstrapFromRoute: (routeId: OpeningRouteId, name?: string) => void;
  adjustSilver: (delta: number) => void;
  adjustStamina: (delta: number) => void;
  updatePrestige: (delta: number) => void;
  updateFavor: (delta: number) => void;
  applyCalcDeltas: (result: Pick<CalcAgentResponse, 'deltas'>) => void;
  promoteToRank: (rankId: string) => void;
  advanceSkill: (skillId: string, delta: number) => void;
  patchPlayer: (patch: Partial<PlayerState>) => void;
}

const defaultRoute = OPENING_ROUTE_MAP.xiunv;

const buildPlayerFromRoute = (routeId: OpeningRouteId, name = '沈容华'): PlayerState => {
  const route = OPENING_ROUTE_MAP[routeId];

  return {
    routeId,
    name,
    silver: route.initialSilver,
    stamina: route.initialStamina,
    currentRankId: route.initialRankId,
    baseStats: route.baseStats,
    skills: route.startingSkills,
    persona: route.persona,
  };
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      player: buildPlayerFromRoute(defaultRoute.id),
      bootstrapFromRoute: (routeId, name) => set({ player: buildPlayerFromRoute(routeId, name) }),
      adjustSilver: (delta) =>
        set((state) => ({
          player: {
            ...state.player,
            silver: Math.max(0, state.player.silver + delta),
          },
        })),
      adjustStamina: (delta) =>
        set((state) => ({
          player: {
            ...state.player,
            stamina: Math.max(0, Math.min(100, state.player.stamina + delta)),
          },
        })),
      updatePrestige: (delta) =>
        set((state) => ({
          player: {
            ...state.player,
            baseStats: {
              ...state.player.baseStats,
              prestige: Math.max(0, state.player.baseStats.prestige + delta),
            },
          },
        })),
      updateFavor: (delta) =>
        set((state) => ({
          player: {
            ...state.player,
            baseStats: {
              ...state.player.baseStats,
              favor: Math.max(0, state.player.baseStats.favor + delta),
            },
          },
        })),
      applyCalcDeltas: (result) =>
        set((state) => ({
          player: {
            ...state.player,
            silver: Math.max(0, state.player.silver + result.deltas.silver),
            stamina: Math.max(0, Math.min(100, state.player.stamina + result.deltas.stamina)),
            baseStats: {
              ...state.player.baseStats,
              favor: Math.max(0, state.player.baseStats.favor + result.deltas.favor),
              prestige: Math.max(0, state.player.baseStats.prestige + result.deltas.prestige),
            },
          },
        })),
      promoteToRank: (rankId) => {
        const rank = RANK_BY_ID[rankId];
        if (!rank) {
          return;
        }

        set((state) => ({
          player: {
            ...state.player,
            currentRankId: rank.id,
          },
        }));
      },
      advanceSkill: (skillId, delta) =>
        set((state) => ({
          player: {
            ...state.player,
            skills: {
              ...state.player.skills,
              [skillId]: Math.max(0, Math.min(100, (state.player.skills[skillId] ?? 0) + delta)),
            },
          },
        })),
      patchPlayer: (patch) => set((state) => ({ player: { ...state.player, ...patch } })),
    }),
    {
      name: 'palace-player-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
