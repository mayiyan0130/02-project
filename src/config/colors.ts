import type { FourColorDefinition } from '../types/game';

export const FOUR_COLORS: Record<FourColorDefinition['key'], FourColorDefinition> = {
  'glow-red': {
    key: 'glow-red',
    label: '发光红',
    hex: '#FF0800',
    aura: '锋芒、宠眷、爆发',
    attributeBias: 'favor',
  },
  violet: {
    key: 'violet',
    label: '紫',
    hex: '#E840B2',
    aura: '华贵、谋略、风仪',
    attributeBias: 'intrigue',
  },
  blue: {
    key: 'blue',
    label: '蓝',
    hex: '#7371D8',
    aura: '冷静、学识、筹算',
    attributeBias: 'intellect',
  },
  cyan: {
    key: 'cyan',
    label: '青',
    hex: '#70D1D7',
    aura: '清誉、声望、韧性',
    attributeBias: 'prestige',
  },
};

export const FOUR_COLOR_ORDER = Object.values(FOUR_COLORS);
