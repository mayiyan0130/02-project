import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  FAVOR_TIER_TABLE,
  PLAYER_AMBITION_RANGE,
  PLAYER_APPEARANCE_RANGE,
  PLAYER_FAVOR_RANGE,
  PLAYER_FORTUNE_RANGE,
  PLAYER_HEALTH_RANGE,
  PLAYER_INTRIGUE_RANGE,
  PLAYER_STRESS_RANGE,
  PLAYER_TEMPERAMENT_RANGE,
  PRESTIGE_RANGE,
} from '../config/constants';
import type { DowagerState, NPCProfile, SpecialNPCState } from '../types/game';

interface NPCStore {
  concubines: NPCProfile[];
  dowager: DowagerState;
  specialNPCs: SpecialNPCState[];
  addConcubine: (npc: NPCProfile) => void;
  updateConcubine: (npcId: string, patch: Partial<NPCProfile>) => void;
  updateDowager: (patch: Partial<DowagerState>) => void;
  updateSpecialNPC: (npcId: string, standing: number) => void;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const NPC_STAT_RANGES = {
  prestige: PRESTIGE_RANGE,
  favor: PLAYER_FAVOR_RANGE,
  fortune: PLAYER_FORTUNE_RANGE,
  ambition: PLAYER_AMBITION_RANGE,
  stress: PLAYER_STRESS_RANGE,
  intrigue: PLAYER_INTRIGUE_RANGE,
  appearance: PLAYER_APPEARANCE_RANGE,
  temperament: PLAYER_TEMPERAMENT_RANGE,
  health: PLAYER_HEALTH_RANGE,
} as const;

type NPCStatKey = keyof typeof NPC_STAT_RANGES;

const FAVOR_TIER_LIMITS = FAVOR_TIER_TABLE.filter((tier) => tier.maxCount > 0)
  .sort((left, right) => right.range[0] - left.range[0])
  .map((tier) => ({
    ...tier,
    demoteTo: tier.range[0] - 1,
  }));

const normalizeNpcStatValue = (key: NPCStatKey, value: number): number => {
  const [min, max] = NPC_STAT_RANGES[key];
  const numericValue = Number(value ?? 0);
  const scaledValue =
    (key === 'intrigue' || key === 'appearance' || key === 'temperament' || key === 'health') && Math.abs(numericValue) <= 100
      ? numericValue * 10
      : numericValue;
  return clamp(scaledValue, min, max);
};

const normalizeNpcStats = (stats: NPCProfile['stats']): NPCProfile['stats'] => {
  const nextStats = { ...stats };
  (Object.keys(NPC_STAT_RANGES) as NPCStatKey[]).forEach((key) => {
    if (typeof nextStats[key] === 'number') {
      nextStats[key] = normalizeNpcStatValue(key, Number(nextStats[key]));
    }
  });
  return nextStats;
};

const resolveNpcRankIdByPrestige = (prestige?: number): string => {
  const numericPrestige = Number(prestige ?? 0);
  if (numericPrestige >= 2500) return 'huanghou';
  if (numericPrestige >= 2100) return 'guifei';
  if (numericPrestige >= 1800) return 'sifei';
  if (numericPrestige >= 1500) return 'fei';
  if (numericPrestige >= 1100) return 'guipin';
  if (numericPrestige >= 900) return 'jieyu';
  if (numericPrestige >= 600) return 'pin';
  if (numericPrestige >= 450) return 'guiren';
  if (numericPrestige >= 350) return 'meiren';
  if (numericPrestige >= 250) return 'cairen';
  if (numericPrestige >= 200) return 'changzai';
  return 'daying';
};

const normalizeNpcProfile = (npc: NPCProfile): NPCProfile => ({
  ...npc,
  rankId: resolveNpcRankIdByPrestige(npc.stats.prestige) || npc.rankId,
  stats: normalizeNpcStats(npc.stats),
});

const enforceNpcFavorTierCaps = (npcs: NPCProfile[]): NPCProfile[] => {
  const nextNpcs = npcs.map(normalizeNpcProfile);

  for (const tier of FAVOR_TIER_LIMITS) {
    const matchingIndexes = nextNpcs
      .map((npc, index) => ({ npc, index }))
      .filter(({ npc }) => {
        const favor = Number(npc.stats.favor ?? 0);
        return favor >= tier.range[0] && favor <= tier.range[1];
      })
      .sort((left, right) => {
        const favorDelta = Number(right.npc.stats.favor ?? 0) - Number(left.npc.stats.favor ?? 0);
        if (favorDelta !== 0) {
          return favorDelta;
        }
        return Number(right.npc.stats.prestige ?? 0) - Number(left.npc.stats.prestige ?? 0);
      });

    matchingIndexes.slice(tier.maxCount).forEach(({ npc, index }) => {
      nextNpcs[index] = normalizeNpcProfile({
        ...npc,
        stats: {
          ...npc.stats,
          favor: clamp(tier.demoteTo, PLAYER_FAVOR_RANGE[0], PLAYER_FAVOR_RANGE[1]),
        },
      });
    });
  }

  return nextNpcs;
};

const defaultConcubines: NPCProfile[] = enforceNpcFavorTierCaps([
  normalizeNpcProfile({
    id: 'consort-yao-linger',
    name: '姚铃儿',
    rankId: 'guifei',
    palette: 'glow-red',
    disposition: '骄矜、好胜、重脸面、嫉妒、权位',
    familyBackground: '三品文官嫡女',
    biography: '贵妃，十九岁，得宠且高傲，极重体面。她与皇帝有旧情，前期把后宫权位看得极重。',
    blackened: 48,
    custom: false,
    stats: {
      prestige: 2180,
      favor: 72,
      fortune: 8,
      ambition: 48,
      stress: 32,
      intrigue: 780,
      appearance: 860,
      temperament: 780,
      health: 720,
    },
  }),
  normalizeNpcProfile({
    id: 'consort-shen-miaoqing',
    name: '沈妙清',
    rankId: 'changzai',
    palette: 'cyan',
    disposition: '清冷、护短、跟随、寡言、认死理',
    familyBackground: '六品武将嫡女',
    biography: '常在，十五岁，表面安静冷淡，骨子里却极护短，许多选择都系在旧情旧义上。',
    blackened: 12,
    custom: false,
    stats: {
      prestige: 215,
      favor: 22,
      fortune: 20,
      ambition: 6,
      stress: 14,
      intrigue: 430,
      appearance: 700,
      temperament: 750,
      health: 710,
    },
  }),
]);

export const useNPCStore = create<NPCStore>()(
  persist(
    (set) => ({
      concubines: defaultConcubines,
      dowager: {
        favorability: 46,
        authorityPressure: 72,
      },
      specialNPCs: [
        { id: 's-1', label: '太医令', relation: '情报合作', standing: 34 },
        { id: 's-2', label: '掌事姑姑', relation: '规矩监督', standing: 48 },
      ],
      addConcubine: (npc) =>
        set((state) => ({ concubines: enforceNpcFavorTierCaps([...state.concubines, normalizeNpcProfile(npc)]) })),
      updateConcubine: (npcId, patch) =>
        set((state) => ({
          concubines: enforceNpcFavorTierCaps(
            state.concubines.map((npc) =>
              npc.id === npcId
                ? normalizeNpcProfile({
                    ...npc,
                    ...patch,
                    stats: {
                      ...npc.stats,
                      ...(patch.stats ?? {}),
                    },
                  })
                : npc,
            ),
          ),
        })),
      updateDowager: (patch) => set((state) => ({ dowager: { ...state.dowager, ...patch } })),
      updateSpecialNPC: (npcId, standing) =>
        set((state) => ({
          specialNPCs: state.specialNPCs.map((npc) => (npc.id === npcId ? { ...npc, standing } : npc)),
        })),
    }),
    {
      name: 'palace-npc-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
