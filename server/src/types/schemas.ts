import { z } from 'zod';

export const calcAgentRequestSchema = z.object({
  traceId: z.string().min(1),
  action: z.string().min(1),
  player: z.object({
    routeId: z.string().min(1),
    name: z.string().min(1),
    silver: z.number(),
    stamina: z.number(),
    currentRankId: z.string().min(1),
    baseStats: z.object({
      charm: z.number(),
      intellect: z.number(),
      intrigue: z.number(),
      prestige: z.number(),
      favor: z.number(),
      resilience: z.number(),
    }),
    skills: z.record(z.string(), z.number()),
    persona: z.object({
      title: z.string(),
      summary: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    }),
  }),
  emperor: z.object({
    mood: z.enum(['疏离', '审视', '愉悦', '偏爱', '多疑', '暴怒']),
    sincerity: z.number(),
    nightlyInterest: z.number(),
    lastSummonTraceId: z.string().optional(),
  }),
  location: z.string().min(1),
  time: z.object({
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    xun: z.number().int().min(1).max(3),
    slotIndex: z.number().int().min(0).max(6),
    slot: z.string().min(1),
  }),
  weights: z.record(z.string(), z.number()).optional(),
});

export const calcAgentResponseSchema = z.object({
  traceId: z.string(),
  success: z.boolean(),
  probability: z.number(),
  deltas: z.object({
    silver: z.number(),
    stamina: z.number(),
    favor: z.number(),
    prestige: z.number(),
  }),
  metrics: z.array(
    z.object({
      key: z.string(),
      value: z.number(),
      description: z.string(),
    }),
  ),
  anomalyDetected: z.boolean(),
  rollbackSuggested: z.boolean(),
  cacheKey: z.string(),
  generatedAt: z.string(),
});

export const narrativeAgentResponseSchema = z.object({
  traceId: z.string(),
  summary: z.string(),
  lines: z.array(
    z.object({
      speaker: z.string(),
      text: z.string(),
      emotion: z.string(),
    }),
  ),
  referencedMetrics: z.array(
    z.object({
      key: z.string(),
      value: z.number(),
      description: z.string(),
    }),
  ),
  locale: z.string(),
});

export const openingDialogueRequestSchema = z.object({
  routeId: z.string().min(1),
  playerName: z.string().min(1),
  family: z.string().min(1),
  playerTitle: z.string().min(1),
  residenceName: z.string().min(1),
  npcName: z.string().min(1),
  topic: z.string().min(1),
  turn: z.number().int().min(1),
  selectedOptionId: z.string().min(1).optional(),
  selectedOptionLabel: z.string().min(1).optional(),
  history: z.array(
    z.object({
      speaker: z.string().min(1),
      text: z.string().min(1),
    }),
  ),
  playerContext: z.object({
    currentRank: z.string().min(1),
    personality: z.string().min(1),
    routeLabel: z.string().min(1).optional(),
    favor: z.number(),
    stress: z.number(),
    prestige: z.number(),
    trueHeart: z.number(),
    silver: z.number(),
    stamina: z.number(),
    stats: z.record(z.string(), z.number()),
  }),
  timeContext: z.object({
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    xun: z.number().int().min(1).max(3),
    slotIndex: z.number().int().min(0).max(6),
    slot: z.string().min(1),
    slotProgress: z.number().min(0).max(1).optional(),
  }),
});

const dialogueDataEffectsSchema = z.object({
  silver: z.number(),
  stamina: z.number(),
  favor: z.number(),
  prestige: z.number(),
  stress: z.number(),
  trueHeart: z.number(),
  stats: z.record(z.string(), z.number()),
  flags: z.record(z.string(), z.boolean()).optional(),
});

export const openingDialogueResponseSchema = z.object({
  mode: z.enum(['line', 'branch']),
  phase: z.enum(['continue', 'finish']),
  speakerIdentity: z.string().min(1),
  speakerName: z.string().min(1),
  text: z.string().min(1),
  nextActionLabel: z.string().min(1),
  timeCost: z.number().min(0).max(1),
  dataEffects: dialogueDataEffectsSchema,
  options: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      effectHint: z.string().min(1),
      nextTopic: z.string().min(1).optional(),
      hiddenEffects: dialogueDataEffectsSchema,
      timeCost: z.number().min(0).max(1),
    }),
  ),
});

const relationshipToneTagSchema = z.enum(['friendly', 'flirt', 'cold', 'reject', 'neutral']);

export const relationshipJudgeRequestSchema = z.object({
  routeId: z.string().min(1),
  npcId: z.string().min(1),
  sceneType: z.string().min(1),
  optionText: z.string().min(1),
  npcProfile: z.string().min(1),
  currentFavor: z.number(),
  currentAffection: z.number(),
  recentContext: z.array(z.string().min(1)),
});

export const relationshipJudgeResponseSchema = z.object({
  toneTag: relationshipToneTagSchema,
  favorDelta: z.number().int().min(-1).max(1),
  affectionDelta: z.number().int().min(-1).max(1),
  reason: z.string().min(1),
  confidence: z.number().min(0).max(1),
});
