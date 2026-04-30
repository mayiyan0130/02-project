import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
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

const defaultConcubines: NPCProfile[] = [
  {
    id: 'npc-01',
    name: '容嫔',
    rankId: 'pin',
    palette: 'violet',
    disposition: '善笑却心深',
    blackened: 24,
    custom: false,
    stats: { intrigue: 72, favor: 58 },
  },
  {
    id: 'npc-02',
    name: '温贵人',
    rankId: 'guiren',
    palette: 'cyan',
    disposition: '温顺守礼',
    blackened: 8,
    custom: false,
    stats: { charm: 54, prestige: 46 },
  },
];

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
      addConcubine: (npc) => set((state) => ({ concubines: [...state.concubines, npc] })),
      updateConcubine: (npcId, patch) =>
        set((state) => ({
          concubines: state.concubines.map((npc) => (npc.id === npcId ? { ...npc, ...patch } : npc)),
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
