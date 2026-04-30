import { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { requestCalculation } from '../ai/calcAgent';
import { pollNarrativeByTraceId } from '../ai/narrateAgent';
import { ActionGrid } from '../components/hud/ActionGrid';
import { TopBar } from '../components/hud/TopBar';
import { NPCDesigner } from '../components/custom/NPCDesigner';
import { SceneBack } from '../components/visual/SceneBack';
import { SpriteStage } from '../components/visual/SpriteStage';
import { DialogueBox } from '../components/vn/DialogueBox';
import { useEmperorStore } from '../store/emperorStore';
import { useGameStore } from '../store/gameStore';
import { useNPCStore } from '../store/npcStore';
import { usePlayerStore } from '../store/playerStore';
import type { CalcAgentResponse, NarrativeAgentResponse } from '../types/game';

const actions = ['请安', '打探', '献艺', '送礼', '休息', '拜见太后', '结交宫人', '筹划宫宴', '静观其变'];

export function Theater() {
  const { player, applyCalcDeltas } = usePlayerStore();
  const { emperor, setLastSummonTraceId } = useEmperorStore();
  const { location, time, tickTime } = useGameStore();
  const { concubines, addConcubine } = useNPCStore();
  const [busy, setBusy] = useState(false);
  const [calcResult, setCalcResult] = useState<CalcAgentResponse>();
  const [narrative, setNarrative] = useState<NarrativeAgentResponse>();

  const currentLine = useMemo(() => narrative?.lines[0], [narrative]);

  const handleAction = async (action: string) => {
    setBusy(true);
    try {
      const traceId = uuidv4();
      const result = await requestCalculation({
        traceId,
        action,
        player,
        emperor,
        location,
        time,
        weights: {
          risk: 0.65,
          reward: 0.75,
          stability: 0.4,
        },
      });
      setCalcResult(result);
      applyCalcDeltas(result);
      setLastSummonTraceId(traceId);
      tickTime(1);
      const generatedNarrative = await pollNarrativeByTraceId(traceId);
      setNarrative(generatedNarrative);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="theater-shell">
      <div className="theater-stage">
        <SceneBack sceneName={`${location} · ${time.month}月${time.xun}旬·${time.slot}`} />
        <TopBar player={player} />
        <div className="theater-stage__body">
          <SpriteStage cast={concubines} />
          <section className="theater-stage__panel">
            <DialogueBox line={currentLine} metrics={calcResult?.metrics ?? []} />
            <ActionGrid actions={actions} busy={busy} onSelect={handleAction} />
          </section>
        </div>
        <NPCDesigner onCreate={addConcubine} />
      </div>
    </main>
  );
}
