import {
  requestOpeningDialogue,
  type OpeningDialogueRequestPayload,
  type OpeningDialogueResponsePayload,
} from '../../ai/openingDialogueAgent';

const emptyEffects = () => ({
  silver: 0,
  stamina: 0,
  favor: 0,
  prestige: 0,
  stress: 0,
  trueHeart: 0,
  stats: {},
});

const buildFixedGuideOptions = (): OpeningDialogueResponsePayload['options'] => [
  {
    id: 'steady',
    label: '韬光养晦',
    effectHint: '先藏锋芒，稳住脚跟。',
    nextTopic: 'opening-guide-finish',
    hiddenEffects: emptyEffects(),
    timeCost: 0,
  },
  {
    id: 'radiant',
    label: '清辉照影',
    effectHint: '微露风华，自教人难忘。',
    nextTopic: 'opening-guide-finish',
    hiddenEffects: emptyEffects(),
    timeCost: 0,
  },
  {
    id: 'balanced',
    label: '左右逢源',
    effectHint: '先探虚实，再慢慢铺路。',
    nextTopic: 'opening-guide-finish',
    hiddenEffects: emptyEffects(),
    timeCost: 0,
  },
] as const;

export const buildLocalOpeningDialogue = (payload: OpeningDialogueRequestPayload): OpeningDialogueResponsePayload => {
  if (payload.turn <= 1) {
    return {
      mode: 'line',
      phase: 'continue',
      speakerIdentity: '贴身宫女',
      speakerName: payload.npcName,
      text: `${payload.playerTitle}，奴婢${payload.npcName}先伺候您熟悉宫里的日子。右上角会记着时辰、银两与体力，往后每做一件事，都要看天时与体力。`,
      nextActionLabel: '下一句',
      timeCost: 0,
      dataEffects: emptyEffects(),
      options: [],
    };
  }

  if (payload.turn === 2) {
    return {
      mode: 'line',
      phase: 'continue',
      speakerIdentity: '贴身宫女',
      speakerName: payload.npcName,
      text: `待会儿奴婢先陪您认一认宫里的大地图，再回${payload.residenceName}安排行程。御书房、宝华殿与各宫位置都要先记住，左侧那些常驻入口也都是您往后常用的地方。`,
      nextActionLabel: '听明白了',
      timeCost: 0,
      dataEffects: emptyEffects(),
      options: [],
    };
  }

  return {
    mode: 'branch',
    phase: 'finish',
    speakerIdentity: '贴身宫女',
    speakerName: payload.npcName,
    text: `开局这一步，最要紧的是先定下您今日待人行事的心思。娘娘不妨先选个起手章法，后头奴婢也好照着替您铺路。`,
    nextActionLabel: '定下心思',
    timeCost: 0,
    dataEffects: emptyEffects(),
    options: [...buildFixedGuideOptions()],
  };
};

const normalizeOpeningDialogue = (
  response: OpeningDialogueResponsePayload,
  payload: OpeningDialogueRequestPayload,
): OpeningDialogueResponsePayload => {
  const fallback = buildLocalOpeningDialogue(payload);
  const expectedMode = payload.turn >= 3 ? 'branch' : 'line';
  const text = String(response.text ?? '').trim();

  if (!text || response.mode !== expectedMode) {
    return fallback;
  }

  return {
    ...response,
    phase: expectedMode === 'branch' ? 'finish' : 'continue',
    nextActionLabel: expectedMode === 'branch' ? fallback.nextActionLabel : String(response.nextActionLabel ?? fallback.nextActionLabel),
    timeCost: 0,
    dataEffects: emptyEffects(),
    options: expectedMode === 'branch' ? [...buildFixedGuideOptions()] : [],
  };
};

export const requestOpeningDialogueWithFallback = async (
  payload: OpeningDialogueRequestPayload,
): Promise<OpeningDialogueResponsePayload> => {
  try {
    const response = await requestOpeningDialogue(payload);
    return normalizeOpeningDialogue(response, payload);
  } catch {
    return buildLocalOpeningDialogue(payload);
  }
};
