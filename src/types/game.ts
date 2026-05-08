export type PaletteKey = 'glow-red' | 'violet' | 'blue' | 'cyan';

export interface FourColorDefinition {
  key: PaletteKey;
  label: string;
  hex: string;
  aura: string;
  attributeBias: 'favor' | 'intrigue' | 'intellect' | 'prestige';
}

export interface RankDefinition {
  id: string;
  level: number;
  name: string;
  maxCount: number;
  prestigeThreshold: number;
  palette: PaletteKey;
}

export interface SkillTierDefinition {
  label: '入门' | '熟练' | '精通' | '绝伦';
  min: number;
  max: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  category: '礼仪' | '心计' | '才艺' | '统御' | '洞察';
}

export type OpeningRouteId = 'xiunv' | 'gongnv' | 'cairen' | 'guifei' | 'huanghou';

export interface PersonaProfile {
  title: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
}

export interface PlayerBaseStats {
  charm: number;
  intellect: number;
  intrigue: number;
  prestige: number;
  favor: number;
  resilience: number;
}

export interface OpeningRouteDefinition {
  id: OpeningRouteId;
  label: string;
  initialSilver: number;
  initialStamina: number;
  initialRankId: string;
  baseStats: PlayerBaseStats;
  startingSkills: Record<string, number>;
  persona: PersonaProfile;
}

export interface PlayerState {
  routeId: OpeningRouteId;
  name: string;
  silver: number;
  stamina: number;
  currentRankId: string;
  baseStats: PlayerBaseStats;
  skills: Record<string, number>;
  persona: PersonaProfile;
}

export type EmperorMood = '疏离' | '审视' | '愉悦' | '偏爱' | '多疑' | '暴怒';

export interface EmperorState {
  mood: EmperorMood;
  sincerity: number;
  nightlyInterest: number;
  lastSummonTraceId?: string;
}

export interface NPCProfile {
  id: string;
  name: string;
  rankId: string;
  palette: PaletteKey;
  disposition: string;
  familyBackground?: string;
  biography?: string;
  blackened: number;
  custom: boolean;
  stats: Partial<
    PlayerBaseStats & {
      prestige: number;
      favor: number;
      fortune: number;
      ambition: number;
      stress: number;
      intrigue: number;
      appearance: number;
      temperament: number;
      health: number;
    }
  >;
}

export interface DowagerState {
  favorability: number;
  authorityPressure: number;
}

export interface SpecialNPCState {
  id: string;
  label: string;
  relation: string;
  standing: number;
}

export type MapLocation = '寝宫' | '御花园' | '尚仪局' | '凤仪宫' | '养心殿' | '冷宫';

export type TimeSlot = '清晨' | '上午' | '中午' | '下午' | '傍晚' | '夜晚' | '深夜';

export interface GameTime {
  year: number;
  month: number;
  xun: number;
  slotIndex: number;
  slot: TimeSlot;
}

export interface SaveSnapshot {
  savedAt: string;
  player: PlayerState;
  emperor: EmperorState;
  location: MapLocation;
  time: GameTime;
}

export interface NumericNode {
  key: string;
  value: number;
  description: string;
}

export interface CalcAgentRequest {
  traceId: string;
  action: string;
  player: PlayerState;
  emperor: EmperorState;
  location: MapLocation;
  time: GameTime;
  weights?: Record<string, number>;
}

export interface CalcAgentResponse {
  traceId: string;
  success: boolean;
  probability: number;
  deltas: {
    silver: number;
    stamina: number;
    favor: number;
    prestige: number;
  };
  metrics: NumericNode[];
  anomalyDetected: boolean;
  rollbackSuggested: boolean;
  cacheKey: string;
  generatedAt: string;
}

export interface NarrativeLine {
  speaker: string;
  text: string;
  emotion: string;
}

export interface NarrativeAgentResponse {
  traceId: string;
  summary: string;
  lines: NarrativeLine[];
  referencedMetrics: NumericNode[];
  locale: string;
}
