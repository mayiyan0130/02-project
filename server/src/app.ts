import Fastify from 'fastify';
import { readEnv, type ServerEnv } from './config/env';
import { EponeClient } from './clients/eponeClient';
import { LoggerAlertingAdapter } from './lib/alerting';
import { createCacheBus } from './lib/redis';
import { registerErrorHandler } from './plugins/errorHandler';
import { registerAiRoutes } from './routes/aiRoutes';
import { CalcAgentService } from './modules/ai/calcService';
import { NarrativeAgentService } from './modules/ai/narrativeService';
import { NarrativeWorker } from './modules/ai/narrativeWorker';
import { OpeningDialogueService } from './modules/ai/openingDialogueService';
import { RelationshipJudgeService } from './modules/ai/relationshipJudgeService';
import { FoundationConfigRegistry } from './modules/foundation/configRegistry';
import { FoundationRepository } from './modules/foundation/repository';
import { FoundationService } from './modules/foundation/service';
import { registerFoundationRoutes } from './routes/foundationRoutes';

export const buildApp = async (runtimeEnv: ServerEnv = readEnv()) => {
  const app = Fastify({ logger: true });
  const cacheBus = createCacheBus(runtimeEnv.redisUrl);
  const statAiClient = new EponeClient({
    apiKey: runtimeEnv.statAiApiKey || runtimeEnv.eponeApiKey,
    baseUrl: runtimeEnv.statAiBaseUrl || runtimeEnv.eponeBaseUrl,
    timeoutMs: runtimeEnv.aiTimeoutMs,
  });
  const textAiClient = new EponeClient({
    apiKey: runtimeEnv.textAiApiKey || runtimeEnv.eponeApiKey,
    baseUrl: runtimeEnv.textAiBaseUrl || runtimeEnv.eponeBaseUrl,
    timeoutMs: runtimeEnv.aiTimeoutMs,
  });
  const alerting = new LoggerAlertingAdapter();
  const calcService = new CalcAgentService(runtimeEnv, cacheBus, statAiClient, alerting);
  const narrativeService = new NarrativeAgentService(runtimeEnv, cacheBus, textAiClient, alerting);
  const openingDialogueService = new OpeningDialogueService(runtimeEnv, textAiClient);
  const relationshipJudgeService = new RelationshipJudgeService(runtimeEnv, textAiClient);
  const worker = new NarrativeWorker(cacheBus, narrativeService, alerting);
  const foundationRegistry = new FoundationConfigRegistry();
  const foundationRepository = new FoundationRepository();
  const foundationService = new FoundationService(foundationRegistry, foundationRepository, app.log);

  registerErrorHandler(app);
  await registerAiRoutes(app, { calcService, narrativeService, openingDialogueService, relationshipJudgeService });
  await registerFoundationRoutes(app, foundationService);
  await worker.start();

  return app;
};
