import type { NPCProfile } from '../../types/game';

interface SpriteStageProps {
  cast: NPCProfile[];
}

export function SpriteStage({ cast }: SpriteStageProps) {
  return (
    <section className="sprite-stage">
      {cast.slice(0, 3).map((npc, index) => (
        <article key={npc.id} className={`sprite-stage__card sprite-stage__card--${index}`}>
          <strong>{npc.name}</strong>
          <span>{npc.disposition}</span>
          <span>{`黑化值 ${npc.blackened}`}</span>
        </article>
      ))}
    </section>
  );
}
