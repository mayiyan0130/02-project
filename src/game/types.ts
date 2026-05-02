export type RouteId = 'lanyinxuguo' | 'fushengrumeng' | 'yingluoyeting' | 'chenyuansucuo';
export type SceneId = 'menu' | 'attribute' | 'briefing' | 'dialogue' | 'activity' | 'map';
export type CurrentView = 'start' | 'route-selection' | 'attribute-assignment' | 'opening-dialogue' | 'map-main' | 'bedchamber';
export type TimeSlot = '清晨' | '上午' | '中午' | '下午' | '傍晚' | '夜晚' | '深夜';
export type ActivityId =
  | '练习音律'
  | '训练舞技'
  | '研读诗书'
  | '女红刺绣'
  | '请平安脉'
  | '殿内休息'
  | '离开寝居';

export type MapAreaId =
  | '御书房'
  | '御膳房'
  | '建章宫'
  | '御花园'
  | '正阳门'
  | '宫门'
  | '冷宫'
  | '养心殿'
  | '太医院'
  | '妙音堂'
  | '宝华殿'
  | '华清池'
  | '重华宫'
  | '椒房殿'
  | '储秀宫'
  | '长春宫'
  | '启祥宫'
  | '钟粹宫'
  | '昭阳宫'
  | '玉清宫'
  | '永宁宫'
  | '永和宫'
  | '延禧宫'
  | '临华殿'
  | '昭华殿'
  | '披香殿';

export interface AttributeField {
  key: string;
  label: string;
  min: number;
  max: number;
  value: number;
  note?: string;
}

export interface GameNumericsState {
  name: string;
  age: number;
  family: string;
  residenceName: string;
  openingTendency?: string;
  pointsTotal: number;
  pointsLeft: number;
  routeId: RouteId;
  actionPoints: number;
  stamina: number;
  silver: number;
  prestige: number;
  stress: number;
  favor: number;
  trueHeart: number;
  stats: Record<string, number>;
  flags: Record<string, boolean>;
}

export interface PalaceTimeState {
  year: number;
  month: number;
  xun: number;
  slotIndex: number;
  slot: TimeSlot;
  slotProgress: number;
}

export interface HiddenStatsState {
  silver: number;
  prestige: number;
  stress: number;
  favor: number;
  trueHeart: number;
  favorLabel: string;
  favorColor: string;
  initialRank?: string;
}

export interface RouteSelectionProfile {
  id: RouteId;
  label: string;
  labelArt: string;
  intro: string;
  defaultName: string;
  familyDisplay: string;
  residenceDisplay: string;
  aptitudeDisplay?: string;
  biography: string;
  clearanceRequirement: string;
  difficulty: string;
  portrait: string;
  fontMask: string;
  bannerHeight: number;
  bannerOffsetTop?: number;
  familyOptions?: string[];
  statsLocked?: boolean;
  baseState: Partial<GameNumericsState>;
  hiddenStats: HiddenStatsState;
}

export interface NumericSaveEnvelope {
  data: GameNumericsState;
  checksum: string;
  savedAt: string;
}

export interface DialogueDataEffects {
  silver: number;
  stamina: number;
  favor: number;
  prestige: number;
  stress: number;
  trueHeart: number;
  stats: Record<string, number>;
  flags?: Record<string, boolean>;
}

export interface DialogueOption {
  id: string;
  label: string;
  effectHint: string;
  nextTopic?: string;
  hiddenEffects?: DialogueDataEffects;
  timeCost?: number;
}

export interface DialogueTurn {
  speaker: string;
  text: string;
  options: DialogueOption[];
  mode?: 'line' | 'branch';
  nextActionLabel?: string;
}

export type RelationshipToneTag = 'friendly' | 'flirt' | 'cold' | 'reject' | 'neutral';

export interface RelationshipJudgeOutcome {
  toneTag: RelationshipToneTag;
  favorDelta: number;
  affectionDelta: number;
  reason: string;
  confidence: number;
  source: 'ai' | 'fallback';
  optionText: string;
}

export interface BondProfileState {
  routeId: RouteId;
  npcId: string;
  npcName: string;
  sceneType: string;
  title: string;
  summary: string;
  favor: number;
  affection: number;
  xunKey: string;
  favorDeltaThisXun: number;
  affectionDeltaThisXun: number;
  recentContext: string[];
  lastOptionText?: string;
  lastToneTag?: RelationshipToneTag;
  lastReason?: string;
  lastConfidence?: number;
  lastSource?: 'ai' | 'fallback';
}

export interface BondInteractionOption {
  id: string;
  label: string;
  summary: string;
  fallbackToneTag: RelationshipToneTag;
}

export interface ResourceMappingEntry {
  slot: string;
  source: string;
  runtime: string;
  note: string;
}

export type ConcubineStatus = 'live' | 'limbo' | 'deceased';

export interface ConcubineStats {
  prestige: number;
  favor: number;
  familyInfluence: number;
  health: number;
  appearance: number;
  relationToPlayer: number;
  childrenCount: number;
  ambition: number;
  stress: number;
  intrigue: number;
  temperament: number;
  affection: number;
  fortune: number;
}

export interface ConcubineConditionFlags {
  illness?: boolean;
  madness?: boolean;
  pregnant?: boolean;
}

export interface ConcubineProfile {
  id: string;
  routeScope?: RouteId | 'all';
  portraitId: string;
  name: string;
  rankLabel: string;
  posthumousTitle?: string;
  status: ConcubineStatus;
  residence: string;
  stateLabel: string;
  conditionFlags?: ConcubineConditionFlags;
  age: number;
  familyBackground: string;
  personality: string;
  summary: string;
  source: 'fixed' | 'generated' | 'custom';
  stats: ConcubineStats;
  allies: string[];
  rivals: string[];
  isCustomConsort?: boolean;
  customSource?: 'player';
  entrySource?: string;
  personaCard?: string;
  insertedAtXun?: string;
}
