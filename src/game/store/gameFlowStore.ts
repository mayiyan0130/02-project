import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STAMINA_INITIAL_PER_XUN, STAMINA_MAX } from '../../config/constants';
import type { ChamberPanelId } from '../../config/bedchamber';
import { attributeFields } from '../data/config';
import { buildInitialBondProfile } from '../data/bondPresets';
import { buildInitialConcubineRoster } from '../data/concubineRoster';
import type {
  BondProfileState,
  ConcubineProfile,
  CurrentView,
  DialogueTurn,
  GameNumericsState,
  HiddenStatsState,
  NumericSaveEnvelope,
  PalaceTimeState,
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
  setCurrentView: (view: CurrentView) => void;
  setScene: (scene: SceneId) => void;
  openChamberPanel: (panel: ChamberPanelId) => void;
  closeChamberPanel: () => void;
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
const timeSlots: PalaceTimeState['slot'][] = ['清晨', '上午', '中午', '下午', '傍晚', '夜晚', '深夜'];
const getCurrentXunKey = (time: PalaceTimeState): string => `${time.year}-${time.month}-${time.xun}`;
const sanitizeRelationshipDelta = (value: number): number => Math.max(-1, Math.min(1, Math.trunc(value || 0)));
const resolveXunStartingStamina = (): number => clampInt(STAMINA_INITIAL_PER_XUN, 0, STAMINA_MAX);

const resolveFavorPresentation = (favor: number): Pick<HiddenStatsState, 'favorLabel' | 'favorColor'> => {
  if (favor >= 81) return { favorLabel: '独宠', favorColor: '#FF0800' };
  if (favor >= 61) return { favorLabel: '盛宠', favorColor: '#E840B2' };
  if (favor >= 41) return { favorLabel: '得宠', favorColor: '#7371D8' };
  if (favor >= 21) return { favorLabel: '小宠', favorColor: '#70D1D7' };
  if (favor >= 1) return { favorLabel: '无宠', favorColor: '#7C7B78' };
  if (favor >= -49) return { favorLabel: '厌恶', favorColor: '#7C7B78' };
  return { favorLabel: '憎恶', favorColor: '#7C7B78' };
};

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
  favorLabel: '得宠',
  favorColor: '#7371D8',
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
const initialConcubines = buildInitialConcubineRoster('lanyinxuguo');

export const useGameFlowStore = create<GameFlowStore>()(
  persist(
    (set) => ({
      currentView: 'start',
      scene: 'menu',
      activeChamberPanel: 'main',
      activeMapLocation: undefined,
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
      setCurrentView: (currentView) => set({ currentView }),
      setScene: (scene) => set({ scene }),
      openChamberPanel: (activeChamberPanel) => set({ activeChamberPanel }),
      closeChamberPanel: () => set({ activeChamberPanel: 'main' }),
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
          concubines: buildInitialConcubineRoster(routeId, current.customConsorts),
        })),
      applyRouteSelection: (profile) =>
        set((current) => ({
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
            favor: profile.hiddenStats.favor,
            trueHeart: profile.hiddenStats.trueHeart,
            pointsTotal: profile.baseState.pointsTotal ?? current.state.pointsTotal,
            pointsLeft: profile.baseState.pointsTotal ?? profile.baseState.pointsLeft ?? current.state.pointsLeft,
            flags: {
              ...current.state.flags,
              routeLockedStats: Boolean(profile.statsLocked),
            },
          }),
          hiddenStats: profile.hiddenStats,
          bondProfile: buildInitialBondProfile(profile.id, getCurrentXunKey(current.time)),
          concubineRouteId: profile.id,
          concubines: buildInitialConcubineRoster(profile.id, current.customConsorts),
        })),
      patchState: (patch) =>
        set((current) => {
          const merged = { ...current.state, ...patch };
          const shouldValidate = 'family' in patch || 'stats' in patch || 'pointsTotal' in patch || 'pointsLeft' in patch;
          return { state: shouldValidate ? validatePointsState(merged) : merged };
        }),
      patchHiddenStats: (patch) =>
        set((current) => {
          const merged = { ...current.hiddenStats, ...patch };
          const nextFavor = typeof merged.favor === 'number' ? merged.favor : current.hiddenStats.favor;
          return {
            hiddenStats: {
              ...merged,
              ...resolveFavorPresentation(nextFavor),
            },
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
            return current;
          }

          return {
            concubineRouteId: targetRouteId,
            concubines: buildInitialConcubineRoster(targetRouteId, current.customConsorts),
          };
        }),
      addCustomConsort: (consort) =>
        set((current) => {
          const customConsorts = [...current.customConsorts, consort];
          return {
            customConsorts,
            concubines: buildInitialConcubineRoster(current.state.routeId, customConsorts),
            concubineRouteId: current.state.routeId,
          };
        }),
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
            favor: current.state.favor + (effects.favor ?? 0),
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
          let crossedIntoNextXun = false;

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
                crossedIntoNextXun = true;
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

          const nextState = crossedIntoNextXun
            ? {
                ...current.state,
                stamina: resolveXunStartingStamina(),
              }
            : current.state;

          return {
            state: nextState,
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
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<GameFlowStore>),
        currentView: 'start',
        activeChamberPanel: (persisted as Partial<GameFlowStore>)?.activeChamberPanel ?? 'main',
        activeMapLocation: (persisted as Partial<GameFlowStore>)?.activeMapLocation,
        bondProfile:
          (persisted as Partial<GameFlowStore>)?.bondProfile ??
          buildInitialBondProfile(current.state.routeId, getCurrentXunKey(current.time)),
        concubineRouteId: (persisted as Partial<GameFlowStore>)?.concubineRouteId ?? current.state.routeId,
        concubines:
          (persisted as Partial<GameFlowStore>)?.concubines ??
          buildInitialConcubineRoster(
            (persisted as Partial<GameFlowStore>)?.routeId ?? current.state.routeId,
            (persisted as Partial<GameFlowStore>)?.customConsorts ?? [],
          ),
        customConsorts: (persisted as Partial<GameFlowStore>)?.customConsorts ?? [],
      }),
    },
  ),
);
