import type { SkillDefinition, SkillTierDefinition } from '../types/game';

export const SKILL_TIERS: SkillTierDefinition[] = [
  { label: '入门', min: 0, max: 25 },
  { label: '熟练', min: 26, max: 50 },
  { label: '精通', min: 51, max: 75 },
  { label: '绝伦', min: 76, max: 100 },
];

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  { id: 'etiquette', name: '礼仪', description: '宫廷礼法与应对进退。', category: '礼仪' },
  { id: 'intrigue', name: '心计', description: '布局、试探与反制能力。', category: '心计' },
  { id: 'performance', name: '才艺', description: '琴棋书画与宴会表现。', category: '才艺' },
  { id: 'governance', name: '统御', description: '驭下、资源与局势统筹。', category: '统御' },
  { id: 'insight', name: '洞察', description: '识人、看势与风险判断。', category: '洞察' },
];

export const resolveSkillTier = (value: number): SkillTierDefinition => {
  return SKILL_TIERS.find((tier) => value >= tier.min && value <= tier.max) ?? SKILL_TIERS[0];
};
