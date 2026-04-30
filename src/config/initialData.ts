import type { OpeningRouteDefinition } from '../types/game';

export const OPENING_ROUTES: OpeningRouteDefinition[] = [
  {
    id: 'xiunv',
    label: '秀女',
    initialSilver: 180,
    initialStamina: 88,
    initialRankId: 'xuanhui',
    baseStats: { charm: 72, intellect: 58, intrigue: 46, prestige: 35, favor: 40, resilience: 60 },
    startingSkills: { etiquette: 42, intrigue: 30, performance: 50, governance: 20, insight: 36 },
    persona: {
      title: '初入深宫的新枝',
      summary: '容色出众，尚未彻底学会隐藏锋芒。',
      strengths: ['容貌惊艳', '天真易得宠'],
      weaknesses: ['根基单薄', '易受算计'],
    },
  },
  {
    id: 'gongnv',
    label: '宫女',
    initialSilver: 96,
    initialStamina: 92,
    initialRankId: 'nvguan',
    baseStats: { charm: 48, intellect: 62, intrigue: 54, prestige: 22, favor: 18, resilience: 84 },
    startingSkills: { etiquette: 38, intrigue: 48, performance: 20, governance: 28, insight: 44 },
    persona: {
      title: '从底层摸爬滚打的眼线',
      summary: '熟悉宫中路径与人情冷暖，擅长蛰伏。',
      strengths: ['隐忍耐劳', '线索丰富'],
      weaknesses: ['出身受限', '初始名望低'],
    },
  },
  {
    id: 'cairen',
    label: '才人',
    initialSilver: 260,
    initialStamina: 84,
    initialRankId: 'cairen',
    baseStats: { charm: 64, intellect: 68, intrigue: 56, prestige: 55, favor: 48, resilience: 62 },
    startingSkills: { etiquette: 46, intrigue: 44, performance: 52, governance: 40, insight: 48 },
    persona: {
      title: '名声初立的温婉才人',
      summary: '已在宫中有一席之地，但上升空间仍大。',
      strengths: ['声望平稳', '能力均衡'],
      weaknesses: ['缺少爆点', '容易被夹击'],
    },
  },
  {
    id: 'guifei',
    label: '贵妃',
    initialSilver: 520,
    initialStamina: 78,
    initialRankId: 'guifei',
    baseStats: { charm: 80, intellect: 74, intrigue: 70, prestige: 82, favor: 76, resilience: 58 },
    startingSkills: { etiquette: 68, intrigue: 72, performance: 66, governance: 58, insight: 60 },
    persona: {
      title: '风头正盛的宠妃',
      summary: '宠眷深厚，但也成为众矢之的。',
      strengths: ['宠爱优势', '资源充沛'],
      weaknesses: ['仇恨集中', '风险暴露高'],
    },
  },
  {
    id: 'huanghou',
    label: '皇后',
    initialSilver: 680,
    initialStamina: 76,
    initialRankId: 'huanghou',
    baseStats: { charm: 74, intellect: 82, intrigue: 78, prestige: 98, favor: 58, resilience: 72 },
    startingSkills: { etiquette: 78, intrigue: 76, performance: 58, governance: 82, insight: 74 },
    persona: {
      title: '位极中宫的秩序执掌者',
      summary: '掌握名分与规制，需平衡权势与人心。',
      strengths: ['名分巅峰', '统御极强'],
      weaknesses: ['难再晋位', '容错极低'],
    },
  },
];

export const OPENING_ROUTE_MAP = Object.fromEntries(OPENING_ROUTES.map((route) => [route.id, route]));
