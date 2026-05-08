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

const resolveSpeakerIdentity = (payload: OpeningDialogueRequestPayload): string =>
  payload.npcContext?.identity?.trim() || '贴身宫女';

const resolveRouteSummary = (payload: OpeningDialogueRequestPayload): string =>
  payload.routeContext?.playerRoleSummary?.trim() || '您如今已入宫墙，这一步先得把自己的处境看明白。';

const resolveRoutePressure = (payload: OpeningDialogueRequestPayload): string =>
  payload.routeContext?.routePressure?.trim() || '宫中人人看规矩，也看人心，行事总得留些余地。';

const resolveMapFeatureSummary = (payload: OpeningDialogueRequestPayload): string =>
  payload.routeContext?.mapFeatureSummary?.trim() ||
  '御书房、宝华殿与后宫入口最常用，先把这些地方认熟，后头才好安排行程。';

const resolveChoiceFocus = (payload: OpeningDialogueRequestPayload): string =>
  payload.routeContext?.choiceFocus?.trim() || '眼下最紧要的，是先定下待人行事的起手章法。';

export const buildLocalOpeningDialogue = (payload: OpeningDialogueRequestPayload): OpeningDialogueResponsePayload => {
  const speakerIdentity = resolveSpeakerIdentity(payload);
  const routeSummary = resolveRouteSummary(payload);
  const routePressure = resolveRoutePressure(payload);
  const mapFeatureSummary = resolveMapFeatureSummary(payload);
  const choiceFocus = resolveChoiceFocus(payload);

  if (payload.turn <= 1) {
    return {
      mode: 'line',
      phase: 'continue',
      speakerIdentity,
      speakerName: payload.npcName,
      text: `${payload.playerTitle}，奴婢${payload.npcName}先陪您把眼下局面捋清。${routeSummary}${routePressure}右上角记着时辰、银两与体力，往后每做一件事，都得先看分寸与余力。`,
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
      speakerIdentity,
      speakerName: payload.npcName,
      text: `待会儿奴婢先陪您认一认宫里的大地图。${mapFeatureSummary}认过这些地方，再回${payload.residenceName}安排行程，您之后要走哪一步，心里才不至于乱。`,
      nextActionLabel: '听明白了',
      timeCost: 0,
      dataEffects: emptyEffects(),
      options: [],
    };
  }

  return {
    mode: 'branch',
    phase: 'finish',
    speakerIdentity,
    speakerName: payload.npcName,
    text: `${payload.playerTitle}，如今最要紧的不是多走一步，而是先定起手章法。${choiceFocus}您先拿个主意，后头奴婢也好照着替您铺路。`,
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
