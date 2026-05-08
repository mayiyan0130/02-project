import type { PalaceTimeState } from '../game/types';
import type { RelationshipToneTag } from '../game/types';
import { buildApiUrl } from './apiBaseUrl';

export interface ConsortDialogueRequestPayload {
  routeId: string;
  playerName: string;
  playerRank: string;
  playerResidence: string;
  playerOpeningTendency?: string;
  canPunish: boolean;
  topic: 'visit' | 'action' | 'follow-up';
  actionId: string;
  actionLabel: string;
  actionResult?: string;
  selectedOptionId?: string;
  selectedOptionLabel?: string;
  giftItemName?: string;
  smearTargetName?: string;
  history: Array<{
    speaker: string;
    text: string;
  }>;
  recentContext: string[];
  playerContext: {
    favor: number;
    stress: number;
    prestige: number;
    trueHeart: number;
    silver: number;
    stamina: number;
    stats: Record<string, number>;
  };
  consortContext: {
    id: string;
    name: string;
    rank: string;
    residence: string;
    stateLabel: string;
    personality: string;
    summary: string;
    currentGoodwill: number;
    currentAffection: number;
    emperorFavor: number;
    stress: number;
    allies: string[];
    rivals: string[];
  };
  timeContext: PalaceTimeState;
}

export interface ConsortDialogueOptionPayload {
  id: string;
  label: string;
  effectHint: string;
  fallbackToneTag: RelationshipToneTag;
  nextTopic?: string;
}

export interface ConsortDialogueResponsePayload {
  mode: 'line' | 'branch';
  phase: 'continue' | 'finish';
  speakerIdentity: string;
  speakerName: string;
  text: string;
  nextActionLabel: string;
  sceneHint?: string;
  options: ConsortDialogueOptionPayload[];
}

export const requestConsortDialogue = async (
  payload: ConsortDialogueRequestPayload,
): Promise<ConsortDialogueResponsePayload> => {
  const response = await fetch(buildApiUrl('/api/v1/ai/consort-dialogue'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`妃嫔对话 AI 调用失败: ${response.status}`);
  }

  return response.json() as Promise<ConsortDialogueResponsePayload>;
};
