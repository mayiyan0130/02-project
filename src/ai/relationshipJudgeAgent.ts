import type { RelationshipToneTag } from '../game/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export interface RelationshipJudgeRequestPayload {
  routeId: string;
  npcId: string;
  sceneType: string;
  optionText: string;
  npcProfile: string;
  currentFavor: number;
  currentAffection: number;
  recentContext: string[];
}

export interface RelationshipJudgeResponsePayload {
  toneTag: RelationshipToneTag;
  favorDelta: number;
  affectionDelta: number;
  reason: string;
  confidence: number;
}

export const requestRelationshipJudge = async (
  payload: RelationshipJudgeRequestPayload,
): Promise<RelationshipJudgeResponsePayload> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/ai/relationship-judge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`关系判定 AI 调用失败: ${response.status}`);
  }

  return response.json() as Promise<RelationshipJudgeResponsePayload>;
};
