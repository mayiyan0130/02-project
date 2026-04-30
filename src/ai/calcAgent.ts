import type { CalcAgentRequest, CalcAgentResponse } from '../types/game';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const requestCalculation = async (payload: CalcAgentRequest): Promise<CalcAgentResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/ai/calc`, {
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
