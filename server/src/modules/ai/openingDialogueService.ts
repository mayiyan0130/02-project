import { openingDialogueResponseSchema } from '../../types/schemas';
import type { ServerEnv } from '../../config/env';
import type { EponeClient } from '../../clients/eponeClient';
import type { OpeningDialogueRequest, OpeningDialogueResponse } from '../../types/contracts';

const titleByFamily = (family: string): string => {
  if (family.includes('皇后') || family.includes('镇国公')) return '娘娘';
  if (family.includes('和亲公主')) return '公主';
  if (family.includes('罪臣')) return '姑娘';
  return '小主';
};

const emptyEffects = () => ({
  silver: 0,
  stamina: 0,
  favor: 0,
  prestige: 0,
  stress: 0,
  trueHeart: 0,
  stats: {},
});

const buildBranchOptions = () => [
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

const buildFallbackOpening = (payload: OpeningDialogueRequest): OpeningDialogueResponse => {
  const title = payload.playerTitle || titleByFamily(payload.family);

  if (payload.turn <= 1) {
    return {
      mode: 'line',
      phase: 'continue',
      speakerIdentity: '贴身宫女',
      speakerName: payload.npcName,
      text: `${title}，奴婢${payload.npcName}先伺候您熟悉宫里的日子。右上角会记着时辰、银两与体力，往后每做一件事，都要看天时与体力。`,
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
    text: `${title}，开局最紧要的是先定下待人行事的章法。娘娘先择一条起手心思，后头奴婢也好照着替您铺路。`,
    nextActionLabel: '定下心思',
    timeCost: 0,
    dataEffects: emptyEffects(),
    options: [...buildBranchOptions()],
  };
};

const normalizeOpeningResponse = (
  response: OpeningDialogueResponse,
  payload: OpeningDialogueRequest,
): OpeningDialogueResponse => {
  const fallback = buildFallbackOpening(payload);
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
    options: expectedMode === 'branch' ? [...buildBranchOptions()] : [],
  };
};

export class OpeningDialogueService {
  constructor(private readonly env: ServerEnv, private readonly textAiClient: EponeClient) {}

  async generate(payload: OpeningDialogueRequest): Promise<OpeningDialogueResponse> {
    try {
      const draft = openingDialogueResponseSchema.parse(
        await this.textAiClient.completeJson<OpeningDialogueResponse>(
          this.env.narrativeModel,
          [
            '你是宫廷养成剧情游戏的 narrative-text-ai，负责输出开场对白 JSON。',
            '你只负责文本包装，不得决定任何真实数值结果。',
            '当前陪伴 NPC 为宫女娇娇，需根据玩家家世、位分、路线背景调整称呼与语气。',
            '文风需简洁、古典、带宿命感，不要现代口语。',
            '你必须输出严格 JSON，不得输出任何 JSON 之外的说明。',
            '字段固定为 mode、phase、speakerIdentity、speakerName、text、nextActionLabel、timeCost、dataEffects、options。',
            '当前开场只允许三步：turn=1 与 turn=2 必须输出 mode=line、phase=continue；turn>=3 必须输出 mode=branch、phase=finish。',
            'turn>=3 时，options 必须固定为三项：steady/韬光养晦、radiant/清辉照影、balanced/左右逢源。',
            'effectHint 可简洁润色，但不得改变这三项的方向含义。',
            'dataEffects 与 options.hiddenEffects 必须全部为 0 和空 stats，因为系统会在前端本地处理真实数值。',
            'timeCost 固定为 0。',
            'turn=1 应聚焦时辰、银两、体力与宫规；turn=2 应聚焦地图、常驻入口与回宫安排；turn>=3 应聚焦“先定起手章法”。',
            'text 长度控制在 70-150 字，聚焦当前处境、宫规、人情与下一步抉择。',
          ].join(''),
          payload,
        ),
      );
      return normalizeOpeningResponse(draft, payload);
    } catch {
      return buildFallbackOpening(payload);
    }
  }
}
