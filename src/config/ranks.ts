import type { RankDefinition } from '../types/game';

export const RANKS: RankDefinition[] = [
  { id: 'daying', level: 1, name: '答应', maxCount: 12, prestigeThreshold: 0, palette: 'cyan' },
  { id: 'changzai', level: 2, name: '常在', maxCount: 10, prestigeThreshold: 20, palette: 'blue' },
  { id: 'guiren', level: 3, name: '贵人', maxCount: 8, prestigeThreshold: 40, palette: 'violet' },
  { id: 'pin', level: 4, name: '嫔', maxCount: 7, prestigeThreshold: 65, palette: 'cyan' },
  { id: 'guipin', level: 5, name: '贵嫔', maxCount: 6, prestigeThreshold: 90, palette: 'blue' },
  { id: 'fei', level: 6, name: '妃', maxCount: 5, prestigeThreshold: 120, palette: 'violet' },
  { id: 'guifei', level: 7, name: '贵妃', maxCount: 4, prestigeThreshold: 160, palette: 'glow-red' },
  { id: 'huangguifei', level: 8, name: '皇贵妃', maxCount: 2, prestigeThreshold: 220, palette: 'glow-red' },
  { id: 'huanghou', level: 9, name: '皇后', maxCount: 1, prestigeThreshold: 300, palette: 'violet' },
  { id: 'nvguan', level: 10, name: '女官', maxCount: 18, prestigeThreshold: 0, palette: 'blue' },
  { id: 'shunu', level: 11, name: '淑女', maxCount: 14, prestigeThreshold: 10, palette: 'cyan' },
  { id: 'xuanhui', level: 12, name: '选侍', maxCount: 12, prestigeThreshold: 24, palette: 'blue' },
  { id: 'caiji', level: 13, name: '才姬', maxCount: 10, prestigeThreshold: 42, palette: 'violet' },
  { id: 'cairen', level: 14, name: '才人', maxCount: 8, prestigeThreshold: 68, palette: 'cyan' },
  { id: 'meiren', level: 15, name: '美人', maxCount: 8, prestigeThreshold: 96, palette: 'blue' },
  { id: 'jieyu', level: 16, name: '婕妤', maxCount: 6, prestigeThreshold: 132, palette: 'violet' },
  { id: 'zhaorong', level: 17, name: '昭容', maxCount: 4, prestigeThreshold: 178, palette: 'glow-red' },
  { id: 'zhaoyi', level: 18, name: '昭仪', maxCount: 3, prestigeThreshold: 238, palette: 'glow-red' },
];

export const RANK_BY_ID = Object.fromEntries(RANKS.map((rank) => [rank.id, rank]));
