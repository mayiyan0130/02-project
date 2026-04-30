import type { NarrativeLine, NumericNode } from '../../types/game';
import { Typewriter } from './Typewriter';

interface DialogueBoxProps {
  line?: NarrativeLine;
  metrics: NumericNode[];
}

export function DialogueBox({ line, metrics }: DialogueBoxProps) {
  return (
    <section className="dialogue-box">
      <div className="dialogue-box__header">
        <span>{line?.speaker ?? '旁白'}</span>
        <span>{line?.emotion ?? '平静'}</span>
      </div>
      <Typewriter text={line?.text ?? '请从九宫格中选择行动，AI 将根据当前局势补完剧情。'} />
      <div className="dialogue-box__metrics">
        {metrics.map((metric) => (
          <span key={metric.key}>{`${metric.description}: ${metric.value.toFixed(4)}`}</span>
        ))}
      </div>
    </section>
  );
}
