export interface ServerEnv {
  port: number;
  redisUrl: string;
  eponeBaseUrl: string;
  eponeApiKey: string;
  textAiBaseUrl: string;
  textAiApiKey: string;
  statAiBaseUrl: string;
  statAiApiKey: string;
  calcModel: string;
  narrativeModel: string;
  relationshipJudgeModel: string;
  aiTimeoutMs: number;
  cacheTtlSec: number;
  alarmWebhookUrl?: string;
}

export const readEnv = (): ServerEnv => ({
  port: Number(process.env.PORT ?? 8787),
  redisUrl: process.env.REDIS_URL ?? 'memory://local',
  eponeBaseUrl: process.env.EPONE_BASE_URL ?? 'https://epone.ggb.today',
  eponeApiKey: process.env.EPONE_API_KEY ?? '',
  textAiBaseUrl: process.env.TEXT_AI_BASE_URL ?? process.env.EPONE_BASE_URL ?? 'https://api.deepseek.com',
  textAiApiKey: process.env.TEXT_AI_API_KEY ?? process.env.EPONE_API_KEY ?? '',
  statAiBaseUrl: process.env.STAT_AI_BASE_URL ?? process.env.EPONE_BASE_URL ?? 'https://api.deepseek.com',
  statAiApiKey: process.env.STAT_AI_API_KEY ?? process.env.EPONE_API_KEY ?? '',
  calcModel: process.env.CALC_AGENT_MODEL ?? 'gpt-4o-mini',
  narrativeModel: process.env.NARRATE_AGENT_MODEL ?? 'gpt-4o-mini',
  relationshipJudgeModel: process.env.RELATIONSHIP_JUDGE_MODEL ?? process.env.NARRATE_AGENT_MODEL ?? 'gpt-4o-mini',
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 700),
  cacheTtlSec: Number(process.env.CACHE_TTL_SEC ?? 1800),
  alarmWebhookUrl: process.env.ALARM_WEBHOOK_URL,
});
