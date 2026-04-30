import type { BondInteractionOption, BondProfileState, RouteId } from '../types';

const routeBondCopy: Record<RouteId, Pick<BondProfileState, 'npcId' | 'npcName' | 'sceneType' | 'title' | 'summary'>> = {
  lanyinxuguo: {
    npcId: 'rongan',
    npcName: '容安',
    sceneType: '中宫议事',
    title: '中宫夫妻 / 权力伴侣',
    summary: '你与容安共系中宫与朝局，言语里稍多一分暖意，常常就意味着多一分试探。',
  },
  fushengrumeng: {
    npcId: 'rongan',
    npcName: '容安',
    sceneType: '偶遇回话',
    title: '低位相逢 / 渐次被看见',
    summary: '这一路更多是从被忽略到被看见，分寸稍偏，落在帝王眼里便是完全不同的意味。',
  },
  yingluoyeting: {
    npcId: 'rongan',
    npcName: '容安',
    sceneType: '翻案试探',
    title: '被压制之后的谨慎试探',
    summary: '掖庭旧案未雪之前，容安对你的每一次回望都掺着怀疑与衡量，关系增长必须慢而稳。',
  },
  chenyuansucuo: {
    npcId: 'aling',
    npcName: '阿翎',
    sceneType: '故国私语',
    title: '故国青梅 / 逃离可能',
    summary: '阿翎牵连着故国旧情与离宫可能，你们之间的亲近更容易落在暧昧与试探之间。',
  },
};

export const buildInitialBondProfile = (routeId: RouteId, xunKey: string): BondProfileState => {
  const copy = routeBondCopy[routeId];
  return {
    routeId,
    npcId: copy.npcId,
    npcName: copy.npcName,
    sceneType: copy.sceneType,
    title: copy.title,
    summary: copy.summary,
    favor: 0,
    affection: 0,
    xunKey,
    favorDeltaThisXun: 0,
    affectionDeltaThisXun: 0,
    recentContext: [],
  };
};

export const BOND_INTERACTION_OPTIONS: readonly BondInteractionOption[] = [
  { id: 'warm-greeting', label: '温声问安', summary: '偏友好，先示以关心。', fallbackToneTag: 'friendly' },
  { id: 'smiling-probe', label: '含笑试探', summary: '偏暧昧，言外多留余地。', fallbackToneTag: 'flirt' },
  { id: 'measured-small-talk', label: '照例寒暄', summary: '偏中性，先不露心思。', fallbackToneTag: 'neutral' },
  { id: 'cool-distance', label: '语气疏冷', summary: '偏冷淡，刻意拉开分寸。', fallbackToneTag: 'cold' },
  { id: 'gentle-refusal', label: '婉拒靠近', summary: '偏拒斥，明示不愿更近。', fallbackToneTag: 'reject' },
] as const;
