import { RANK_BY_ID } from '../../config/ranks';
import type { PlayerState } from '../../types/game';

interface TopBarProps {
  player: PlayerState;
}

export function TopBar({ player }: TopBarProps) {
  return (
    <header className="top-bar">
      <span>{`银两 ${player.silver}`}</span>
      <span>{`体力 ${player.stamina}`}</span>
      <span>{`位分 ${RANK_BY_ID[player.currentRankId]?.name ?? '未知'}`}</span>
      <span>{`声望 ${player.baseStats.prestige}`}</span>
    </header>
  );
}
