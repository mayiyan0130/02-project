import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';
import { readEnv } from '../../src/config/env';

let app: Awaited<ReturnType<typeof buildApp>>;

const calcPayload = {
  traceId: 'trace-int-1',
  action: '献艺',
  player: {
    routeId: 'xiunv',
    name: '沈容华',
    silver: 180,
    stamina: 88,
    currentRankId: 'xuanhui',
    baseStats: { charm: 72, intellect: 58, intrigue: 46, prestige: 35, favor: 40, resilience: 60 },
    skills: { etiquette: 42, intrigue: 30, performance: 50, governance: 20, insight: 36 },
    persona: {
      title: '初入深宫的新枝',
      summary: '容色出众，尚未彻底学会隐藏锋芒。',
      strengths: ['容貌惊艳'],
      weaknesses: ['根基单薄'],
    },
  },
  emperor: { mood: '审视', sincerity: 42, nightlyInterest: 38 },
  location: '寝宫',
  time: { year: 1, month: 1, xun: 1, slotIndex: 0, slot: '晨起' },
  weights: { risk: 0.65, reward: 0.75, stability: 0.4 },
};

const openingPayload = {
  routeId: 'lanyinxuguo',
  playerName: '谢令仪',
  family: '镇国公嫡女',
  playerTitle: '皇后娘娘',
  residenceName: '椒房殿',
  npcName: '娇娇',
  topic: 'opening-guide',
  turn: 1,
  history: [],
  playerContext: {
    currentRank: '皇后',
    personality: '未定',
    routeLabel: '兰因絮果',
    favor: 50,
    stress: 30,
    prestige: 2500,
    trueHeart: 35,
    silver: 1000,
    stamina: 4,
    stats: { health: 2, intrigue: 2, politics: 0 },
  },
  timeContext: { year: 1, month: 1, xun: 1, slotIndex: 0, slot: '清晨', slotProgress: 0 },
};

describe('AI routes integration', () => {
  beforeAll(async () => {
    process.env.REDIS_URL = 'memory://integration';
    process.env.EPONE_API_KEY = '';
    process.env.TEXT_AI_API_KEY = '';
    process.env.STAT_AI_API_KEY = '';
    process.env.AI_TIMEOUT_MS = '50';
    app = await buildApp(readEnv());
  });

  afterAll(async () => {
    await app.close();
  });

  it('calc 完成后可读取 narrative', async () => {
    const calcResponse = await app.inject({ method: 'POST', url: '/api/v1/ai/calc', payload: calcPayload });
    const calcBody = JSON.parse(calcResponse.body) as { traceId: string };
    expect(calcResponse.statusCode).toBe(200);
    expect(calcBody.traceId).toBe(calcPayload.traceId);

    const narrativeResponse = await app.inject({ method: 'GET', url: `/api/v1/ai/narrative/${calcPayload.traceId}` });
    expect([200, 404]).toContain(narrativeResponse.statusCode);
  });

  it('opening-dialogue 保持当前固定开场链路契约', async () => {
    const lineResponse = await app.inject({ method: 'POST', url: '/api/v1/ai/opening-dialogue', payload: openingPayload });
    const lineBody = JSON.parse(lineResponse.body) as {
      mode: string;
      options: unknown[];
      dataEffects: { favor: number };
    };
    expect(lineResponse.statusCode).toBe(200);
    expect(lineBody.mode).toBe('line');
    expect(lineBody.options).toEqual([]);
    expect(lineBody.dataEffects.favor).toBe(0);

    const branchResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/opening-dialogue',
      payload: { ...openingPayload, turn: 3 },
    });
    const branchBody = JSON.parse(branchResponse.body) as {
      mode: string;
      phase: string;
      options: Array<{ id: string; hiddenEffects: { favor: number; prestige: number } }>;
    };
    expect(branchResponse.statusCode).toBe(200);
    expect(branchBody.mode).toBe('branch');
    expect(branchBody.phase).toBe('finish');
    expect(branchBody.options.map((item) => item.id)).toEqual(['steady', 'radiant', 'balanced']);
    expect(branchBody.options.every((item) => item.hiddenEffects.favor === 0 && item.hiddenEffects.prestige === 0)).toBe(true);
  });

  it('relationship-judge 返回受控的语气标签与微调结果', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/relationship-judge',
      payload: {
      routeId: 'lanyinxuguo',
      npcId: 'rongan',
      sceneType: '中宫议事',
      optionText: '婉拒靠近',
      npcProfile: '中宫夫妻 / 权力伴侣。言语稍偏，便会牵动帝后之间的分寸。',
      currentFavor: 0,
      currentAffection: 0,
      recentContext: ['温声问安 -> friendly'],
      },
    });
    const body = JSON.parse(response.body) as {
      toneTag: string;
      favorDelta: number;
      affectionDelta: number;
      reason: string;
    };

    expect(response.statusCode).toBe(200);
    expect(body.toneTag).toBe('reject');
    expect(body.favorDelta).toBe(0);
    expect(body.affectionDelta).toBe(-1);
    expect(typeof body.reason).toBe('string');
  });
});
