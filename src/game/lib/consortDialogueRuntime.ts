import {
  requestConsortDialogue,
  type ConsortDialogueRequestPayload,
  type ConsortDialogueResponsePayload,
} from '../../ai/consortDialogueAgent';
import type { ConcubineProfile, ConsortDialogueTurn, RelationshipToneTag } from '../types';

const buildSpeakerIdentity = (consort: ConcubineProfile): string => consort.rankLabel || '宫妃';

const buildVoiceTag = (consort: ConcubineProfile): string => {
  const personality = consort.personality;
  if (personality.includes('骄矜') || personality.includes('好胜')) {
    return '话里仍带两分体面与锋芒';
  }
  if (personality.includes('温顺') || personality.includes('体贴')) {
    return '语气温柔，却总带着细微试探';
  }
  if (personality.includes('清醒') || personality.includes('守密')) {
    return '言辞克制，像是每一句都先在心里过了一遍';
  }
  if (personality.includes('清冷') || personality.includes('寡言')) {
    return '她先敛了眸色，话并不多';
  }
  if (personality.includes('端方') || personality.includes('克制')) {
    return '她礼数周全，叫人一时看不透心底偏向';
  }
  if (personality.includes('娇气') || personality.includes('病弱')) {
    return '她声音轻软，像是稍重些的话都会叫人心里一颤';
  }
  return '她依着自己的性子答话，语气并不肯全然交底';
};

const buildFallbackText = (
  payload: ConsortDialogueRequestPayload,
  consort: ConcubineProfile,
): { text: string; sceneHint: string } => {
  const { actionId, actionResult } = payload;
  const speakerLead = buildVoiceTag(consort);

  if (actionId === 'gift') {
    const itemName = payload.giftItemName ?? '礼物';
    return {
      text: `${speakerLead} ${consort.name}接过${itemName}时，眼尾先轻轻一动，随后才按住情绪向你行礼：“娘娘这份心，妾记下了。只是宫里人情最难还，妾不敢轻慢。”`,
      sceneHint: `${itemName}已送出，接下来可顺势探她心意，或只把场面留在礼数之内。`,
    };
  }

  if (actionId === 'greet') {
    return {
      text: `${speakerLead} ${consort.name}先向你敛衽请安，低声道：“娘娘今日肯亲来${payload.playerResidence === consort.residence ? '殿中' : '看我'}，妾自当好生应答。”`,
      sceneHint: '先从寒暄切入，对方的防备最容易在这种时候露出端倪。',
    };
  }

  if (actionId === 'quarrel') {
    return {
      text: `${speakerLead} 你话锋略重，她也不再一味退让，只把袖口压稳了些：“娘娘若只是来问罪，妾自然不敢顶撞；可若要把话说透，妾也未必全无分寸。”`,
      sceneHint: '口角已经起了火气，后续一句话就可能把关系推得更冷，或硬生生拉回来。',
    };
  }

  if (actionId === 'punish') {
    return {
      text: `${speakerLead} ${consort.name}被你压住声势后，仍强撑着把礼数做足：“规矩既是娘娘定下的，妾自会领罚。只是这笔账，妾也会记得是谁在此刻落了锤。”`,
      sceneHint: '责罚已落地，对方表面不敢违逆，心里却未必肯就此服气。',
    };
  }

  if (actionId === 'win-over') {
    const result = actionResult ?? '';
    return {
      text:
        result.includes('愿与您交好')
          ? `${speakerLead} 她抬眼看了你一瞬，终究还是把那点戒心收了回去：“若娘娘当真肯把妾当自己人，妾也愿把这一份情记在心上。”`
          : result.includes('不会答应')
            ? `${speakerLead} 她静了静，终究还是避开了你的目光：“娘娘的好意，妾不敢领。眼下彼此都还看不透，再近一步，只怕更难收场。”`
            : `${speakerLead} 她没有立刻应下，只轻声道：“娘娘若真想结个善缘，妾也愿慢慢看着。只是宫里话说得太满，反而伤人。”`,
      sceneHint: '拉拢的结果已经摆在面前，接下来更适合顺着她的心门试探，而不是再硬逼一步。',
    };
  }

  if (actionId === 'smear') {
    const targetName = payload.smearTargetName ?? '旁人';
    return {
      text: `${speakerLead} 你把话头引到${targetName}身上时，她指尖明显顿了一顿，随即压低了声线：“宫里流言最会要命。娘娘既肯提这一句，妾自会记着，只是往后还得细看真假。”`,
      sceneHint: `${targetName}已经被你带进这场谈话，对方是否真肯站到你这边，还得看后续这几句怎么说。`,
    };
  }

  return {
    text: `${speakerLead} ${consort.name}在殿中迎了你一礼，目光却没有立刻垂下：“娘娘今日亲来，想必不是只为看一眼宫灯与茶案。妾听着，娘娘尽可以开口。”`,
    sceneHint: '先看她肯不肯把话摊开，再决定是示好、试探还是压她一头。',
  };
};

const buildFallbackOptions = (actionId: string): ConsortDialogueResponsePayload['options'] => {
  if (actionId === 'quarrel' || actionId === 'punish' || actionId === 'smear') {
    return [
      { id: 'soften', label: '缓一缓语气', effectHint: '先收锋芒，免得当场撕破脸。', fallbackToneTag: 'friendly' },
      { id: 'probe', label: '借机再试探', effectHint: '顺势套出她真正的立场。', fallbackToneTag: 'flirt' },
      { id: 'press', label: '照规矩压下', effectHint: '把局面继续扣在威势与礼法里。', fallbackToneTag: 'cold' },
    ];
  }

  return [
    { id: 'warm', label: '温声再问一句', effectHint: '更容易稳稳加一点好感。', fallbackToneTag: 'friendly' },
    { id: 'tease', label: '借话轻轻试探', effectHint: '若她心动，最容易牵出暧昧。', fallbackToneTag: 'flirt' },
    { id: 'hold', label: '只把礼数做满', effectHint: '维持场面，不急着把心意说透。', fallbackToneTag: 'neutral' },
  ];
};

const buildFallbackTurn = (
  payload: ConsortDialogueRequestPayload,
  consort: ConcubineProfile,
): ConsortDialogueTurn => {
  const fallback = buildFallbackText(payload, consort);
  return {
    mode: 'branch',
    phase: 'continue',
    speakerIdentity: buildSpeakerIdentity(consort),
    speakerName: consort.name,
    text: fallback.text,
    nextActionLabel: '收起',
    sceneHint: fallback.sceneHint,
    options: buildFallbackOptions(payload.actionId),
  };
};

const isToneTag = (value: unknown): value is RelationshipToneTag => {
  return value === 'friendly' || value === 'flirt' || value === 'cold' || value === 'reject' || value === 'neutral';
};

const normalizeConsortDialogueResponse = (
  response: ConsortDialogueResponsePayload,
  payload: ConsortDialogueRequestPayload,
  consort: ConcubineProfile,
): ConsortDialogueTurn => {
  const fallback = buildFallbackTurn(payload, consort);
  const text = String(response.text ?? '').trim();
  const mode = response.mode === 'line' ? 'line' : 'branch';

  if (!text) {
    return fallback;
  }

  if (mode === 'line') {
    return {
      mode: 'line',
      phase: response.phase === 'finish' ? 'finish' : 'continue',
      speakerIdentity: String(response.speakerIdentity ?? '').trim() || fallback.speakerIdentity,
      speakerName: String(response.speakerName ?? '').trim() || consort.name,
      text,
      nextActionLabel: String(response.nextActionLabel ?? '').trim() || '下一句',
      sceneHint: String(response.sceneHint ?? '').trim() || fallback.sceneHint,
      options: [],
    };
  }

  const options = response.options
    .filter((option) => option && isToneTag(option.fallbackToneTag))
    .slice(0, 3)
    .map((option, index) => ({
      id: String(option.id ?? `option-${index + 1}`),
      label: String(option.label ?? '').trim() || fallback.options[index]?.label || `选项${index + 1}`,
      effectHint: String(option.effectHint ?? '').trim() || fallback.options[index]?.effectHint || '继续试探她的态度。',
      fallbackToneTag: option.fallbackToneTag,
      nextTopic: option.nextTopic,
    }));

  if (options.length === 0) {
    return fallback;
  }

  return {
    mode: 'branch',
    phase: response.phase === 'finish' ? 'finish' : 'continue',
    speakerIdentity: String(response.speakerIdentity ?? '').trim() || fallback.speakerIdentity,
    speakerName: String(response.speakerName ?? '').trim() || consort.name,
    text,
    nextActionLabel: String(response.nextActionLabel ?? '').trim() || fallback.nextActionLabel,
    sceneHint: String(response.sceneHint ?? '').trim() || fallback.sceneHint,
    options,
  };
};

export const requestConsortDialogueWithFallback = async (
  payload: ConsortDialogueRequestPayload,
  consort: ConcubineProfile,
): Promise<ConsortDialogueTurn> => {
  try {
    const response = await requestConsortDialogue(payload);
    return normalizeConsortDialogueResponse(response, payload, consort);
  } catch {
    return buildFallbackTurn(payload, consort);
  }
};
