import type { NarrativeAgentResponse } from '../types/game';
import { buildApiUrl } from './apiBaseUrl';

export const fetchNarrativeByTraceId = async (traceId: string): Promise<NarrativeAgentResponse> => {
  const response = await fetch(buildApiUrl(`/api/v1/ai/narrative/${traceId}`));

  if (!response.ok) {
    throw new Error(`剧情补全 AI 调用失败: ${response.status}`);
  }

  return response.json() as Promise<NarrativeAgentResponse>;
};

export const pollNarrativeByTraceId = async (
  traceId: string,
  retries = 8,
  delayMs = 250,
): Promise<NarrativeAgentResponse> => {
  for (let index = 0; index < retries; index += 1) {
    try {
      return await fetchNarrativeByTraceId(traceId);
    } catch {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    }
  }

  throw new Error('剧情补全 AI 超时，未能在预期轮询窗口内返回结果。');
};
