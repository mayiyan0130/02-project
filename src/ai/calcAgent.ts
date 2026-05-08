import type { CalcAgentRequest, CalcAgentResponse } from '../types/game';
import { buildApiUrl } from './apiBaseUrl';

export const requestCalculation = async (payload: CalcAgentRequest): Promise<CalcAgentResponse> => {
  const response = await fetch(buildApiUrl('/api/v1/ai/calc'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`数据计算 AI 调用失败: ${response.status}`);
  }

  return response.json() as Promise<CalcAgentResponse>;
};
