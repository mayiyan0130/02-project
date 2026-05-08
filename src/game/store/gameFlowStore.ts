import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { PLAYER_FAVOR_RANGE, STAMINA_INITIAL_PER_XUN, STAMINA_MAX, getFavorTierByValue } from '../../config/constants';
import type { ChamberPanelId } from '../../config/bedchamber';
import { attributeFields } from '../data/config';
import { cloneInitialInventory, getInventoryRecyclePrice } from '../data/inventoryPresets';
import { buildInitialBondProfile } from '../data/bondPresets';
import {
  applyConcubinePressureHealthPenalty,
  buildInitialConcubineRoster,
  enforceConcubineFavorTierCaps,
  normalizeConcubineProfile,
} from '../data/concubineRoster';
import type {
  AffairSourceLabel,
  BondProfileState,
  ConcubineProfile,
  ConsortInteractionProgress,
  ConsortPalaceActionId,
  CurrentView,
  DialogueTurn,
  GameNumericsState,
  HiddenStatsState,
  InventoryItem,
  NumericSaveEnvelope,
  PalaceTimeState,
  KitchenProgressState,
  MedicalProgressState,
  MusicHallProgressState,
  TempleProgressState,
  RelationshipJudgeOutcome,
  RouteSelectionProfile,
  SceneId,
  MapAreaId,
} from '../types';

interface GameFlowStore {
  currentView: CurrentView;
  scene: SceneId;
  activeChamberPanel: ChamberPanelId;
  activeMapLocation?: MapAreaId;
  activeAffairsSource: AffairSourceLabel;
  routeId: GameNumericsState['routeId'];
  state: GameNumericsState;
  hiddenStats: HiddenStatsState;
  time: PalaceTimeState;
  briefing: string;
  mapEventText: string;
  dialogue?: DialogueTurn;
  save?: NumericSaveEnvelope;
  selectedRoute?: RouteSelectionProfile;
  bondProfile: BondProfileState;
  concubineRouteId: GameNumericsState['routeId'];
  concubines: ConcubineProfile[];
  customConsorts: ConcubineProfile[];
  inventory: InventoryItem[];
  merchantLedger: Record<string, number>;
  consortInteractionMap: Record<string, ConsortInteractionProgress>;
  kitchenProgress: KitchenProgressState;
  medicalProgress: MedicalProgressState;
  musicHallProgress: MusicHallProgressState;
  templeProgress: TempleProgressState;
  setCurrentView: (view: CurrentView) => void;
  setScene: (scene: SceneId) => void;
  openChamberPanel: (panel: ChamberPanelId) => void;
  closeChamberPanel: () => void;
  setActiveAffairsSource: (source: AffairSourceLabel) => void;
  enterMainChamber: (location?: MapAreaId | null) => void;
  enterMapMain: () => void;
  setRoute: (routeId: GameNumericsState['routeId']) => void;
  applyRouteSelection: (profile: RouteSelectionProfile) => void;
  patchState: (patch: Partial<GameNumericsState>) => void;
  patchHiddenStats: (patch: Partial<HiddenStatsState>) => void;
  setBriefing: (briefing: string) => void;
  setDialogue: (dialogue?: DialogueTurn) => void;
  setMapEventText: (text: string) => void;
  setSave: (save: NumericSaveEnvelope) => void;
  setAttributeValue: (key: string, value: number) => void;
  validatePoints: () => void;
  ensureBondProfile: (routeId?: GameNumericsState['routeId']) => void;
  ensureConcubines: (routeId?: GameNumericsState['routeId']) => void;
  addCustomConsort: (consort: ConcubineProfile) => void;
  patchConcubineById: (consortId: string, updater: (consort: ConcubineProfile) => ConcubineProfile) => void;
  patchKitchenProgress: (patch: Partial<KitchenProgressState>) => void;
  patchMedicalProgress: (patch: Partial<MedicalProgressState>) => void;
  patchMusicHallProgress: (patch: Partial<MusicHallProgressState>) => void;
  patchTempleProgress: (patch: Partial<TempleProgressState>) => void;
  consumeInventoryItem: (itemId: string) => boolean;
  grantInventoryItem: (item: InventoryItem, quantity?: number) => void;
  buyInventoryItem: (item: InventoryItem, stockLimit?: number | null) => { success: boolean; message: string };
  sellInventoryItem: (itemId: string) => { success: boolean; message: string };
  applyConsortRelationshipJudgement: (
    consortId: string,
    actionId: ConsortPalaceActionId,
    result: RelationshipJudgeOutcome,
  ) => {
    appliedFavorDelta: number;
    appliedAffectionDelta: number;
    favorCapHit: boolean;
    affectionCapHit: boolean;
  };
  applyBondJudgement: (result: RelationshipJudgeOutcome) => void;
  advanceTime: (steps?: number) => void;
  applyStoryEffects: (effects: Partial<GameNumericsState> & { stats?: Record<string, number>; flags?: Record<string, boolean> }) => void;
}

const initialStats = Object.fromEntries(attributeFields.map((field) => [field.key, field.value]));

const getFieldMinMap = (): Record<string, number> => Object.fromEntries(attributeFields.map((field) => [field.key, field.min]));

const sumExcessPoints = (stats: Record<string, number>, mins: Record<string, number>): number =>
  Object.entries(stats).reduce((acc, [key, value]) => {
    const current = Number.isFinite(value) ? Number(value) : 0;
    const min = Number.isFinite(mins[key]) ? Number(mins[key]) : 0;
    return acc + Math.max(0, current - min);
  }, 0);

const clampInt = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, Math.floor(value)));
const clampToRange = (value: number, range: readonly [number, number]): number => Math.max(range[0], Math.min(range[1], value));
const timeSlots: PalaceTimeState['slot'][] = ['清晨', '上午', '中午', '下午', '傍晚', '夜晚', '深夜'];
const getCurrentXunKey = (time: PalaceTimeState): string => `${time.year}-${time.month}-${time.xun}`;
const sanitizeRelationshipDelta = (value: number): number => Math.max(-1, Math.min(1, Math.trunc(value || 0)));
const resolveXunStartingStamina = (): number => clampInt(STAMINA_INITIAL_PER_XUN, 0, STAMINA_MAX);
const normalizePlayerFavor = (favor: number): number => clampToRange(Number(favor ?? 0), PLAYER_FAVOR_RANGE);

const resolveFavorPresentation = (favor: number): Pick<HiddenStatsState, 'favorLabel' | 'favorColor'> => {
  const tier = getFavorTierByValue(favor);
  return {
    favorLabel: tier.label,
    favorColor: tier.color,
  };
};

const enforceRosterFavorCaps = (concubines: ConcubineProfile[], playerFavor: number): ConcubineProfile[] =>
  enforceConcubineFavorTierCaps(concubines, [playerFavor]);

const applyConcubineUpdater = (
  list: ConcubineProfile[],
  consortId: string,
  updater: (consort: ConcubineProfile) => ConcubineProfile,
): ConcubineProfile[] => {
  let touched = false;
  const nextList = list.map((consort) => {
    if (consort.id !== consortId) {
      return consort;
    }
    touched = true;
    return normalizeConcubineProfile(updater(consort));
  });

  return touched ? nextList : list;
};

const createEmptyConsortInteractionProgress = (consortId: string, xunKey: string): ConsortInteractionProgress => ({
  consortId,
  xunKey,
  favorDeltaThisXun: 0,
  affectionDeltaThisXun: 0,
});

const buildRouteConcubines = (
  routeId: GameNumericsState['routeId'],
  customConsorts: ConcubineProfile[],
  playerFavor: number,
): ConcubineProfile[] => buildInitialConcubineRoster(routeId, customConsorts, [playerFavor]);

const resolvePointsTotalByFamily = (family: string): number => {
  const normalized = String(family ?? '').replace(/\s+/g, '');
  if (normalized.includes('镇国公') || normalized.includes('和亲公主')) {
    return 48;
  }
  if (normalized.includes('异国贡女')) {
    return 52;
  }
  if (normalized.includes('罪臣')) {
    return 54;
  }
  if (normalized.includes('商贾')) {
    return 56;
  }

  const gradeMatch = normalized.match(/[一二三四五六七八九]品/);
  if (gradeMatch) {
    const gradeMap: Record<string, number> = {
      一: 1,
      二: 2,
      三: 3,
      四: 4,
      五: 5,
      六: 6,
      七: 7,
      八: 8,
      九: 9,
    };
    const n = gradeMap[gradeMatch[0][0]];
    if (n) {
      return clampInt(47 + n, 48, 56);
    }
  }

  return 50;
};

const rebalanceStatsToFitBudget = (
  stats: Record<string, number>,
  mins: Record<string, number>,
  maxTotal: number,
): Record<string, number> => {
  const currentTotal = sumExcessPoints(stats, mins);
  if (currentTotal <= maxTotal) {
    return stats;
  }

  const overshoot = currentTotal - maxTotal;
  const keys = Object.keys(stats);
  const reducible = keys
    .map((key) => {
      const min = mins[key] ?? 0;
      const current = Number(stats[key] ?? 0);
      return { key, min, current, excess: Math.max(0, current - min) };
    })
    .filter((entry) => entry.excess > 0);

  const totalReducible = reducible.reduce((acc, entry) => acc + entry.excess, 0);
  if (totalReducible < overshoot) {
    return { ...mins };
  }

  const next: Record<string, number> = { ...stats };
  let remaining = overshoot;

  const rawCuts = reducible.map((entry) => ({
    key: entry.key,
    min: entry.min,
    current: entry.current,
    excess: entry.excess,
    cut: Math.floor((overshoot * entry.excess) / totalReducible),
  }));

  for (const item of rawCuts) {
    const cut = Math.min(item.excess, item.cut);
    if (cut <= 0) {
      continue;
    }
    next[item.key] = item.current - cut;
    remaining -= cut;
  }

  if (remaining > 0) {
    const sorted = [...reducible].sort((a, b) => b.excess - a.excess);
    let idx = 0;
    while (remaining > 0 && idx < sorted.length * 10) {
      const entry = sorted[idx % sorted.length];
      const min = mins[entry.key] ?? 0;
      const current = Number(next[entry.key] ?? 0);
      if (current > min) {
        next[entry.key] = current - 1;
        remaining -= 1;
      }
      idx += 1;
    }
  }

  return next;
};

const validatePointsState = (state: GameNumericsState): GameNumericsState => {
  const mins = getFieldMinMap();
  const pointsTotal = resolvePointsTotalByFamily(state.family);
  const normalizedStats = { ...mins, ...(state.stats ?? {}) };
  const balancedStats = rebalanceStatsToFitBudget(normalizedStats, mins, pointsTotal);
  const allocated = sumExcessPoints(balancedStats, mins);
  const pointsLeft = Math.max(0, pointsTotal - allocated);

  return {
    ...state,
    pointsTotal,
    pointsLeft,
    stats: balancedStats,
  };
};

const initialState: GameNumericsState = validatePointsState({
  name: '沈容儿',
  age: 15,
  family: '四品文官义女',
  residenceName: '储秀宫',
  openingTendency: undefined,
  pointsTotal: 48,
  pointsLeft: 24,
  routeId: 'lanyinxuguo',
  actionPoints: 4,
  stamina: STAMINA_INITIAL_PER_XUN,
  silver: 1000,
  prestige: 2500,
  stress: 30,
  favor: 50,
  trueHeart: 35,
  stats: initialStats,
  flags: {},
});

const initialHiddenStats: HiddenStatsState = {
  silver: 1000,
  prestige: 2500,
  stress: 30,
  favor: 50,
  trueHeart: 35,
  ...resolveFavorPresentation(initialState.favor),
};

const initialTime: PalaceTimeState = {
  year: 1,
  month: 1,
  xun: 1,
  slotIndex: 0,
  slot: timeSlots[0],
  slotProgress: 0,
};

const initialBondProfile = buildInitialBondProfile('lanyinxuguo', getCurrentXunKey(initialTime));
const initialConcubines = buildRouteConcubines('lanyinxuguo', [], initialState.favor);
const initialInventory = cloneInitialInventory();
const initialMerchantLedger: Record<string, number> = {};
const createInitialKitchenProgress = (): KitchenProgressState => ({
  strollCount: 0,
  buZiyouUnlocked: false,
  buZiyouMet: false,
  buZiyouFavor: 0,
  buZiyouAffinity: 0,
});

const createInitialTempleProgress = (): TempleProgressState => ({
  worshipCount: 0,
  prayerCount: 0,
  strollCount: 0,
  dangYiFavor: 0,
  dangYiAffinity: 0,
});

const createInitialMedicalProgress = (): MedicalProgressState => ({
  strollCount: 0,
  consultationCount: 0,
  jianNingMet: false,
  jianNingFavor: 0,
  jianNingAffinity: 0,
});

const createInitialMusicHallProgress = (): MusicHallProgressState => ({
  listenCount: 0,
  strollCount: 0,
  signUpCount: 0,
  lianQiaoFirstMet: false,
  lianQiaoMet: false,
  lianQiaoFavor: 0,
  lianQiaoAffection: 0,
});

export const useGameFlowStore = create<GameFlowStore>()(
  persist(
    (set) => ({
      currentView: 'start',
      scene: 'menu',
      activeChamberPanel: 'main',
      activeMapLocation: undefined,
      activeAffairsSource: '宫斗事务',
      routeId: 'lanyinxuguo',
      state: initialState,
      hiddenStats: initialHiddenStats,
      time: initialTime,
      briefing: '',
      mapEventText: '',
      dialogue: undefined,
      save: undefined,
      selectedRoute: undefined,
      bondProfile: initialBondProfile,
      concubineRouteId: 'lanyinxuguo',
      concubines: initialConcubines,
      customConsorts: [],
      inventory: initialInventory,
      merchantLedger: initialMerchantLedger,
      consortInteractionMap: {},
      kitchenProgress: createInitialKitchenProgress(),
      medicalProgress: createInitialMedicalProgress(),
      musicHallProgress: createInitialMusicHallProgress(),
      templeProgress: createInitialTempleProgress(),
      setCurrentView: (currentView) => set({ currentView }),
      setScene: (scene) => set({ scene }),
      openChamberPanel: (activeChamberPanel) => set({ activeChamberPanel }),
      closeChamberPanel: () => set({ activeChamberPanel: 'main' }),
      setActiveAffairsSource: (activeAffairsSource) => set({ activeAffairsSource }),
      enterMainChamber: (location) =>
        set({
          currentView: 'bedchamber',
          scene: 'activity',
          activeChamberPanel: 'main',
          activeMapLocation: location ?? undefined,
        }),
      enterMapMain: () =>
        set({
          currentView: 'map-main',
          scene: 'map',
          activeChamberPanel: 'main',
        }),
      setRoute: (routeId) =>
        set((current) => ({
          routeId,
          state: { ...current.state, routeId },
          bondProfile: buildInitialBondProfile(routeId, getCurrentXunKey(current.time)),
          concubineRouteId: routeId,
          concubines: buildRouteConcubines(routeId, current.customConsorts, current.state.favor),
          merchantLedger: {},
          kitchenProgress: createInitialKitchenProgress(),
          medicalProgress: createInitialMedicalProgress(),
          musicHallProgress: createInitialMusicHallProgress(),
          templeProgress: createInitialTempleProgress(),
        })),
      applyRouteSelection: (profile) =>
        set((current) => {
          const nextFavor = normalizePlayerFavor(profile.hiddenStats.favor);
          return {
            currentView: 'attribute-assignment',
            routeId: profile.id,
          selectedRoute: profile,
          state: validatePointsState({
              ...current.state,
              ...profile.baseState,
              routeId: profile.id,
              name: profile.baseState.name ?? profile.defaultName,
              family: profile.baseState.family ?? profile.familyDisplay,
              residenceName: profile.baseState.residenceName ?? profile.residenceDisplay,
              age: profile.baseState.age ?? current.state.age,
              stamina: profile.baseState.stamina ?? STAMINA_INITIAL_PER_XUN,
              silver: profile.hiddenStats.silver,
              prestige: profile.hiddenStats.prestige,
              stress: profile.hiddenStats.stress,
              favor: nextFavor,
              trueHeart: profile.hiddenStats.trueHeart,
              pointsTotal: profile.baseState.pointsTotal ?? current.state.pointsTotal,
              pointsLeft: profile.baseState.pointsTotal ?? profile.baseState.pointsLeft ?? current.state.pointsLeft,
              flags: {
                ...current.state.flags,
                routeLockedStats: Boolean(profile.statsLocked),
              },
            }),
            hiddenStats: {
              ...profile.hiddenStats,
              favor: nextFavor,
              ...resolveFavorPresentation(nextFavor),
            },
            bondProfile: buildInitialBondProfile(profile.id, getCurrentXunKey(current.time)),
            concubineRouteId: profile.id,
            concubines: buildRouteConcubines(profile.id, current.customConsorts, nextFavor),
            inventory: cloneInitialInventory(),
            merchantLedger: {},
            consortInteractionMap: {},
            kitchenProgress: createInitialKitchenProgress(),
            medicalProgress: createInitialMedicalProgress(),
            musicHallProgress: createInitialMusicHallProgress(),
            templeProgress: createInitialTempleProgress(),
          };
        }),
      patchState: (patch) =>
        set((current) => {
          const merged = { ...current.state, ...patch };
          const shouldValidate = 'family' in patch || 'stats' in patch || 'pointsTotal' in patch || 'pointsLeft' in patch;
          const nextState = {
            ...(shouldValidate ? validatePointsState(merged) : merged),
            favor: normalizePlayerFavor(merged.favor ?? current.state.favor),
          };
          if (typeof patch.favor !== 'number') {
            return { state: nextState };
          }

          return {
            state: nextState,
            hiddenStats: {
              ...current.hiddenStats,
              favor: nextState.favor,
              ...resolveFavorPresentation(nextState.favor),
            },
            concubines: enforceRosterFavorCaps(current.concubines, nextState.favor),
          };
        }),
      patchHiddenStats: (patch) =>
        set((current) => {
          const merged = { ...current.hiddenStats, ...patch };
          const shouldSyncFavor = typeof patch.favor === 'number';
          const nextFavor = normalizePlayerFavor(
            typeof merged.favor === 'number' ? merged.favor : current.hiddenStats.favor,
          );
          return {
            ...(shouldSyncFavor
              ? {
                  state: {
                    ...current.state,
                    favor: nextFavor,
                  },
                }
              : {}),
            hiddenStats: {
              ...merged,
              favor: nextFavor,
              ...resolveFavorPresentation(nextFavor),
            },
            concubines: enforceRosterFavorCaps(current.concubines, nextFavor),
          };
        }),
      setBriefing: (briefing) => set({ briefing }),
      setDialogue: (dialogue) => set({ dialogue }),
      setMapEventText: (text) => set({ mapEventText: text }),
      setSave: (save) => set({ save }),
      setAttributeValue: (key, value) =>
        set((current) => {
          if (current.state.flags.routeLockedStats) {
            return current;
          }
          const field = attributeFields.find((item) => item.key === key);
          if (!field) {
            return current;
          }
          const routeId = current.state.routeId;
          const max =
            key === 'politics'
              ? routeId === 'lanyinxuguo' || routeId === 'chenyuansucuo'
                ? 4
                : 2
              : field.max;
          const min = field.min;
          const currentValue = Number(current.state.stats[key] ?? field.value);
          const nextValue = Math.min(max, Math.max(min, value));
          if (nextValue === currentValue) {
            return current;
          }
          const delta = nextValue - currentValue;
          const currentLeft = current.state.pointsLeft ?? 0;
          const pointsTotal = current.state.pointsTotal ?? 0;
          if (delta > 0 && currentLeft < delta) {
            return current;
          }
          const pointsLeft = Math.min(pointsTotal, Math.max(0, currentLeft - delta));
          return {
            ...current,
            state: {
              ...current.state,
              pointsLeft,
              stats: {
                ...current.state.stats,
                [key]: nextValue,
              },
            },
          };
        }),
      validatePoints: () => set((current) => ({ state: validatePointsState(current.state) })),
      ensureBondProfile: (routeId) =>
        set((current) => {
          const targetRouteId = routeId ?? current.state.routeId;
          if (current.bondProfile?.routeId === targetRouteId) {
            return current;
          }
          return {
            bondProfile: buildInitialBondProfile(targetRouteId, getCurrentXunKey(current.time)),
          };
        }),
      ensureConcubines: (routeId) =>
        set((current) => {
          const targetRouteId = routeId ?? current.state.routeId;
          if (current.concubineRouteId === targetRouteId && current.concubines.length > 0) {
            return {
              concubines: enforceRosterFavorCaps(current.concubines, current.state.favor),
            };
          }

          return {
            concubineRouteId: targetRouteId,
            concubines: buildRouteConcubines(targetRouteId, current.customConsorts, current.state.favor),
          };
        }),
      addCustomConsort: (consort) =>
        set((current) => {
          const customConsorts = [...current.customConsorts, consort];
          return {
            customConsorts,
            concubines: buildRouteConcubines(current.state.routeId, customConsorts, current.state.favor),
            concubineRouteId: current.state.routeId,
          };
        }),
      patchKitchenProgress: (patch) =>
        set((current) => ({
          kitchenProgress: {
            ...current.kitchenProgress,
            ...patch,
          },
        })),
      patchMedicalProgress: (patch) =>
        set((current) => ({
          medicalProgress: {
            ...current.medicalProgress,
            ...patch,
          },
        })),
      patchMusicHallProgress: (patch) =>
        set((current) => ({
          musicHallProgress: {
            ...current.musicHallProgress,
            ...patch,
          },
        })),
      patchTempleProgress: (patch) =>
        set((current) => ({
          templeProgress: {
            ...current.templeProgress,
            ...patch,
          },
        })),
      patchConcubineById: (consortId, updater) =>
        set((current) => {
          const nextConcubines = enforceRosterFavorCaps(
            applyConcubineUpdater(current.concubines, consortId, updater),
            current.state.favor,
          );
          const nextCustomConsorts = applyConcubineUpdater(current.customConsorts, consortId, updater);

          return {
            concubines: nextConcubines,
            customConsorts: nextCustomConsorts,
          };
        }),
      consumeInventoryItem: (itemId) => {
        let consumed = false;
        set((current) => {
          const nextInventory = current.inventory
            .map((item) => {
              if (item.itemId !== itemId || item.quantity <= 0) {
                return item;
              }
              consumed = true;
              return {
                ...item,
                quantity: item.quantity - 1,
              };
            })
            .filter((item) => item.quantity > 0);

          return consumed ? { inventory: nextInventory } : current;
        });
        return consumed;
      },
      grantInventoryItem: (item, quantity = 1) =>
        set((current) => {
          const normalizedQuantity = Math.max(1, Math.floor(quantity));
          const existingIndex = current.inventory.findIndex((entry) => entry.itemId === item.itemId);
          const baseItem = {
            ...item,
            id: item.id ?? item.itemId,
            color: item.color ?? item.rarity,
          };
          const nextInventory =
            existingIndex === -1
              ? [
                  ...current.inventory,
                  {
                    ...baseItem,
                    quantity: normalizedQuantity,
                  },
                ]
              : current.inventory.map((entry, index) =>
                  index === existingIndex
                    ? {
                        ...entry,
                        quantity: entry.quantity + normalizedQuantity,
                      }
                    : entry,
                );

          return {
            inventory: nextInventory,
          };
        }),
      buyInventoryItem: (item, stockLimit) => {
        let result = {
          success: false,
          message: '杜娘今日不卖这件东西。',
        };

        set((current) => {
          if (item.canSell === false) {
            result = {
              success: false,
              message: `${item.name}眼下不在杜娘的货单里。`,
            };
            return current;
          }

          const xunKey = getCurrentXunKey(current.time);
          const ledgerKey = `${xunKey}:${item.itemId}`;
          const boughtCount = current.merchantLedger[ledgerKey] ?? 0;
          if (typeof stockLimit === 'number' && stockLimit >= 0 && boughtCount >= stockLimit) {
            result = {
              success: false,
              message: `${item.name}这一旬已经卖空了。`,
            };
            return current;
          }

          const itemPrice = Math.max(0, Math.floor(item.price));
          if (current.state.silver < itemPrice) {
            result = {
              success: false,
              message: `银两不足，还差${itemPrice - current.state.silver}两。`,
            };
            return current;
          }

          const existingIndex = current.inventory.findIndex((entry) => entry.itemId === item.itemId);
          const nextInventory =
            existingIndex === -1
              ? [
                  ...current.inventory,
                  {
                    ...item,
                    quantity: 1,
                  },
                ]
              : current.inventory.map((entry, index) =>
                  index === existingIndex
                    ? {
                        ...entry,
                        quantity: entry.quantity + 1,
                      }
                    : entry,
                );
          const nextSilver = current.state.silver - itemPrice;

          result = {
            success: true,
            message: `你花了${itemPrice}两买下${item.name}。`,
          };

          return {
            inventory: nextInventory,
            merchantLedger: {
              ...current.merchantLedger,
              [ledgerKey]: boughtCount + 1,
            },
            state: {
              ...current.state,
              silver: nextSilver,
            },
            hiddenStats: {
              ...current.hiddenStats,
              silver: nextSilver,
            },
          };
        });

        return result;
      },
      sellInventoryItem: (itemId) => {
        let result = {
          success: false,
          message: '这件东西眼下卖不出去。',
        };

        set((current) => {
          const inventoryItem = current.inventory.find((item) => item.itemId === itemId);
          if (!inventoryItem || inventoryItem.quantity <= 0) {
            result = {
              success: false,
              message: '背包里已经没有这件东西了。',
            };
            return current;
          }

          if (inventoryItem.canRecycle === false) {
            result = {
              success: false,
              message: `${inventoryItem.name}不在杜娘的回收范围里。`,
            };
            return current;
          }

          const recyclePrice = getInventoryRecyclePrice(inventoryItem);
          const nextInventory = current.inventory
            .map((item) =>
              item.itemId === itemId
                ? {
                    ...item,
                    quantity: item.quantity - 1,
                  }
                : item,
            )
            .filter((item) => item.quantity > 0);
          const nextSilver = current.state.silver + recyclePrice;

          result = {
            success: true,
            message: `杜娘收下了${inventoryItem.name}，给了你${recyclePrice}两。`,
          };

          return {
            inventory: nextInventory,
            state: {
              ...current.state,
              silver: nextSilver,
            },
            hiddenStats: {
              ...current.hiddenStats,
              silver: nextSilver,
            },
          };
        });

        return result;
      },
      applyConsortRelationshipJudgement: (consortId, actionId, result) => {
        let summary = {
          appliedFavorDelta: 0,
          appliedAffectionDelta: 0,
          favorCapHit: false,
          affectionCapHit: false,
        };

        set((current) => {
          const xunKey = getCurrentXunKey(current.time);
          const activeProgress =
            current.consortInteractionMap[consortId]?.xunKey === xunKey
              ? current.consortInteractionMap[consortId]
              : createEmptyConsortInteractionProgress(consortId, xunKey);
          const requestedFavorDelta = sanitizeRelationshipDelta(result.favorDelta);
          const requestedAffectionDelta = sanitizeRelationshipDelta(result.affectionDelta);
          const nextFavorDeltaThisXun = Math.max(-5, Math.min(5, activeProgress.favorDeltaThisXun + requestedFavorDelta));
          const nextAffectionDeltaThisXun = Math.max(
            -5,
            Math.min(5, activeProgress.affectionDeltaThisXun + requestedAffectionDelta),
          );
          const appliedFavorDelta = nextFavorDeltaThisXun - activeProgress.favorDeltaThisXun;
          const appliedAffectionDelta = nextAffectionDeltaThisXun - activeProgress.affectionDeltaThisXun;
          summary = {
            appliedFavorDelta,
            appliedAffectionDelta,
            favorCapHit: requestedFavorDelta !== 0 && appliedFavorDelta === 0,
            affectionCapHit: requestedAffectionDelta !== 0 && appliedAffectionDelta === 0,
          };

          const applyRelationshipDelta = (consort: ConcubineProfile): ConcubineProfile => ({
            ...consort,
            stats: {
              ...consort.stats,
              relationToPlayer: clampToRange(
                Number(consort.stats.relationToPlayer ?? 0) + appliedFavorDelta,
                [-100, 100],
              ),
              affection: clampToRange(Number(consort.stats.affection ?? 0) + appliedAffectionDelta, [0, 100]),
            },
          });

          return {
            concubines: enforceRosterFavorCaps(
              applyConcubineUpdater(current.concubines, consortId, applyRelationshipDelta),
              current.state.favor,
            ),
            customConsorts: applyConcubineUpdater(current.customConsorts, consortId, applyRelationshipDelta),
            consortInteractionMap: {
              ...current.consortInteractionMap,
              [consortId]: {
                ...activeProgress,
                xunKey,
                favorDeltaThisXun: nextFavorDeltaThisXun,
                affectionDeltaThisXun: nextAffectionDeltaThisXun,
                lastActionId: actionId,
                lastOptionText: result.optionText,
                lastToneTag: result.toneTag,
                lastReason: result.reason,
                lastConfidence: result.confidence,
                lastSource: result.source,
              },
            },
          };
        });

        return summary;
      },
      applyBondJudgement: (result) =>
        set((current) => {
          const xunKey = getCurrentXunKey(current.time);
          const activeProfile =
            current.bondProfile?.routeId === current.state.routeId
              ? current.bondProfile
              : buildInitialBondProfile(current.state.routeId, xunKey);
          const favorDeltaThisXun = activeProfile.xunKey === xunKey ? activeProfile.favorDeltaThisXun : 0;
          const affectionDeltaThisXun = activeProfile.xunKey === xunKey ? activeProfile.affectionDeltaThisXun : 0;
          const requestedFavorDelta = sanitizeRelationshipDelta(result.favorDelta);
          const requestedAffectionDelta = sanitizeRelationshipDelta(result.affectionDelta);
          const nextFavorDeltaThisXun = Math.max(-5, Math.min(5, favorDeltaThisXun + requestedFavorDelta));
          const nextAffectionDeltaThisXun = Math.max(-5, Math.min(5, affectionDeltaThisXun + requestedAffectionDelta));
          const appliedFavorDelta = nextFavorDeltaThisXun - favorDeltaThisXun;
          const appliedAffectionDelta = nextAffectionDeltaThisXun - affectionDeltaThisXun;

          return {
            bondProfile: {
              ...activeProfile,
              xunKey,
              favor: activeProfile.favor + appliedFavorDelta,
              affection: activeProfile.affection + appliedAffectionDelta,
              favorDeltaThisXun: nextFavorDeltaThisXun,
              affectionDeltaThisXun: nextAffectionDeltaThisXun,
              recentContext: [...activeProfile.recentContext, `${result.optionText} -> ${result.toneTag}`].slice(-4),
              lastOptionText: result.optionText,
              lastToneTag: result.toneTag,
              lastReason: result.reason,
              lastConfidence: result.confidence,
              lastSource: result.source,
            },
          };
        }),
      applyStoryEffects: (effects) =>
        set((current) => {
          const nextState: GameNumericsState = {
            ...current.state,
            silver: Math.max(0, current.state.silver + (effects.silver ?? 0)),
            stamina: Math.max(0, Math.min(STAMINA_MAX, current.state.stamina + (effects.stamina ?? 0))),
            favor: normalizePlayerFavor(current.state.favor + (effects.favor ?? 0)),
            prestige: Math.max(0, current.state.prestige + (effects.prestige ?? 0)),
            stress: Math.max(0, current.state.stress + (effects.stress ?? 0)),
            trueHeart: current.state.trueHeart + (effects.trueHeart ?? 0),
            stats: {
              ...current.state.stats,
            },
            flags: {
              ...current.state.flags,
              ...(effects.flags ?? {}),
            },
          };

          for (const [key, delta] of Object.entries(effects.stats ?? {})) {
            nextState.stats[key] = Math.max(0, Number(nextState.stats[key] ?? 0) + Number(delta ?? 0));
          }

          return {
            state: nextState,
            concubines: enforceRosterFavorCaps(current.concubines, nextState.favor),
            hiddenStats: {
              ...current.hiddenStats,
              silver: nextState.silver,
              prestige: nextState.prestige,
              stress: nextState.stress,
              favor: nextState.favor,
              trueHeart: nextState.trueHeart,
              ...resolveFavorPresentation(nextState.favor),
            },
          };
        }),
      advanceTime: (steps = 1) =>
        set((current) => {
          let year = current.time.year;
          let month = current.time.month;
          let xun = current.time.xun;
          let slotIndex = current.time.slotIndex;
          let slotProgress = current.time.slotProgress ?? 0;
          let remaining = Math.max(0, steps);
          let xunTransitions = 0;

          while (remaining > 0) {
            const delta = Math.min(1 - slotProgress, remaining);
            slotProgress = Number((slotProgress + delta).toFixed(4));
            remaining = Number((remaining - delta).toFixed(4));

            if (slotProgress >= 1) {
              slotProgress = 0;
              slotIndex += 1;
              if (slotIndex >= timeSlots.length) {
                slotIndex = 0;
                xun += 1;
                xunTransitions += 1;
                if (xun > 3) {
                  xun = 1;
                  month += 1;
                  if (month > 12) {
                    month = 1;
                    year += 1;
                  }
                }
              }
            }
          }

          const nextState = xunTransitions > 0
            ? {
                ...current.state,
                stamina: resolveXunStartingStamina(),
              }
            : current.state;
          const nextConcubines =
            xunTransitions > 0
              ? current.concubines.map((consort) => applyConcubinePressureHealthPenalty(consort, xunTransitions))
              : current.concubines;
          const nextCustomConsorts =
            xunTransitions > 0
              ? current.customConsorts.map((consort) => applyConcubinePressureHealthPenalty(consort, xunTransitions))
              : current.customConsorts;

          return {
            state: nextState,
            concubines: enforceRosterFavorCaps(nextConcubines, nextState.favor),
            customConsorts: nextCustomConsorts,
            time: {
              year,
              month,
              xun,
              slotIndex,
              slot: timeSlots[slotIndex],
              slotProgress,
            },
          };
        }),
    }),
    {
      name: 'palace-galgame-flow',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        scene: state.scene,
        activeChamberPanel: state.activeChamberPanel,
        activeMapLocation: state.activeMapLocation,
        activeAffairsSource: state.activeAffairsSource,
        routeId: state.routeId,
        state: state.state,
        hiddenStats: state.hiddenStats,
        time: state.time,
        briefing: state.briefing,
        mapEventText: state.mapEventText,
        dialogue: state.dialogue,
        save: state.save,
        selectedRoute: state.selectedRoute,
        bondProfile: state.bondProfile,
        concubineRouteId: state.concubineRouteId,
        concubines: state.concubines,
        customConsorts: state.customConsorts,
        inventory: state.inventory,
        merchantLedger: state.merchantLedger,
        consortInteractionMap: state.consortInteractionMap,
        kitchenProgress: state.kitchenProgress,
        medicalProgress: state.medicalProgress,
        musicHallProgress: state.musicHallProgress,
        templeProgress: state.templeProgress,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<GameFlowStore>),
        currentView: 'start',
        activeChamberPanel: (persisted as Partial<GameFlowStore>)?.activeChamberPanel ?? 'main',
        activeMapLocation: (persisted as Partial<GameFlowStore>)?.activeMapLocation,
        activeAffairsSource: (persisted as Partial<GameFlowStore>)?.activeAffairsSource ?? '宫斗事务',
        bondProfile:
          (persisted as Partial<GameFlowStore>)?.bondProfile ??
          buildInitialBondProfile(current.state.routeId, getCurrentXunKey(current.time)),
        concubineRouteId: (persisted as Partial<GameFlowStore>)?.concubineRouteId ?? current.state.routeId,
        concubines:
          (persisted as Partial<GameFlowStore>)?.concubines
            ? enforceConcubineFavorTierCaps(
                (persisted as Partial<GameFlowStore>)?.concubines?.map(normalizeConcubineProfile) ?? [],
                [((persisted as Partial<GameFlowStore>)?.state?.favor ?? current.state.favor)],
              )
            : buildRouteConcubines(
                (persisted as Partial<GameFlowStore>)?.routeId ?? current.state.routeId,
                ((persisted as Partial<GameFlowStore>)?.customConsorts ?? []).map(normalizeConcubineProfile),
                (persisted as Partial<GameFlowStore>)?.state?.favor ?? current.state.favor,
              ),
        customConsorts: ((persisted as Partial<GameFlowStore>)?.customConsorts ?? []).map(normalizeConcubineProfile),
        inventory: (persisted as Partial<GameFlowStore>)?.inventory ?? cloneInitialInventory(),
        merchantLedger: (persisted as Partial<GameFlowStore>)?.merchantLedger ?? {},
        consortInteractionMap: (persisted as Partial<GameFlowStore>)?.consortInteractionMap ?? {},
        kitchenProgress: (persisted as Partial<GameFlowStore>)?.kitchenProgress ?? createInitialKitchenProgress(),
        medicalProgress: (persisted as Partial<GameFlowStore>)?.medicalProgress ?? createInitialMedicalProgress(),
        musicHallProgress: (persisted as Partial<GameFlowStore>)?.musicHallProgress ?? createInitialMusicHallProgress(),
        templeProgress: (persisted as Partial<GameFlowStore>)?.templeProgress ?? createInitialTempleProgress(),
      }),
    },
  ),
);
