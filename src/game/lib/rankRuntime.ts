import { HOT_SPRING_MIN_RANK_NAME, PRESTIGE_RANK_TABLE, SPECIAL_PRESTIGE_RANK_TABLE } from '../../config/constants';

const ALL_PLAYER_RANKS = [...SPECIAL_PRESTIGE_RANK_TABLE, ...PRESTIGE_RANK_TABLE];

export const PLAYER_RANK_WEIGHT_LIST = Object.fromEntries(
  ALL_PLAYER_RANKS.map((entry) => [entry.位分名称, entry.等级]),
) as Record<string, number>;

export const resolvePlayerRankByPrestige = (prestige: number): string => {
  const numericPrestige = Number(prestige ?? 0);
  const matched = [...ALL_PLAYER_RANKS]
    .sort((left, right) => right.所需声望值 - left.所需声望值)
    .find((entry) => numericPrestige >= entry.所需声望值);

  return matched?.位分名称 ?? '官女子';
};

export const getRankWeight = (rankName: string): number => PLAYER_RANK_WEIGHT_LIST[rankName] ?? Number.MAX_SAFE_INTEGER;

export const isRankAtLeast = (currentRankName: string, targetRankName: string): boolean =>
  getRankWeight(currentRankName) <= getRankWeight(targetRankName);

export const canAccessHotSpringByPrestige = (prestige: number): boolean =>
  isRankAtLeast(resolvePlayerRankByPrestige(prestige), HOT_SPRING_MIN_RANK_NAME);
