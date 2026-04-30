import type { CalcAgentResponse, EmperorState, NumericNode, PlayerState } from '../types/game';

export const round4 = (value: number): number => Math.round(value * 10000) / 10000;

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const calculateSilverConsumption = (baseCost: number, governance: number, prestige: number): number => {
  const modifier = 1 - governance * 0.0025 - prestige * 0.0015;
  return round4(baseCost * clamp(modifier, 0.55, 1.25));
};

export const calculateStaminaDelta = (difficulty: number, resilience: number, restBonus: number): number => {
  return round4(clamp(restBonus - difficulty + resilience * 0.12, -35, 20));
};

export const calculatePalaceSuccessRate = (player: PlayerState, riskWeight = 1): number => {
  const score =
    player.baseStats.intellect * 0.28 +
    player.baseStats.intrigue * 0.34 +
    player.baseStats.prestige * 0.18 +
    player.skills.insight * 0.12 +
    player.skills.intrigue * 0.08;

  return round4(clamp((score / (120 * riskWeight)) * 100, 5, 95));
};

export const calculateNightlyAttendanceProbability = (
  player: PlayerState,
  emperor: EmperorState,
  timeBonus = 0,
): number => {
  const moodBonusMap: Record<EmperorState['mood'], number> = {
    疏离: -12,
    审视: -4,
    愉悦: 10,
    偏爱: 18,
    多疑: -8,
    暴怒: -18,
  };

  const score =
    player.baseStats.charm * 0.35 +
    player.baseStats.favor * 0.25 +
    emperor.sincerity * 0.2 +
    moodBonusMap[emperor.mood] +
    timeBonus;

  return round4(clamp(score, 1, 99));
};

export const buildMetricNodes = (player: PlayerState, probability: number): NumericNode[] => [
  { key: 'favor', value: round4(player.baseStats.favor), description: '当前圣心偏向值' },
  { key: 'prestige', value: round4(player.baseStats.prestige), description: '当前名望权重' },
  { key: 'probability', value: round4(probability), description: '事件综合成功率' },
];

export const detectAnomaly = (response: Pick<CalcAgentResponse, 'probability' | 'deltas'>): boolean => {
  const values = [response.probability, ...Object.values(response.deltas)];
  return values.some((value) => !Number.isFinite(value) || Math.abs(value) > 10000);
};
