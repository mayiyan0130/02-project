import { gameApi } from '../lib/gameApi';
import { useGameFlowStore } from '../store/gameFlowStore';

interface BriefingSceneProps {
  onNotice: (message: string) => void;
}

export function BriefingScene({ onNotice }: BriefingSceneProps) {
  const { briefing, state, setDialogue, setScene } = useGameFlowStore();

  const handleContinue = async () => {
    try {
      const dialogue = await gameApi.getDialogueTurn(state, briefing);
      setDialogue(dialogue);
      setScene('dialogue');
      onNotice('已进入剧情对话。');
    } catch (error) {
      onNotice(error instanceof Error ? error.message : '剧情回合生成失败。');
    }
  };

  return (
    <section className="gal-scene gal-scene--briefing" style={{ backgroundImage: "url('/assets/ui/menu-route.png')" }}>
      <div className="gal-overlay gal-overlay--soft" />
      <article className="gal-briefing-card">
        <h2>剧情简报</h2>
        <p>{briefing}</p>
        <button type="button" onClick={handleContinue}>进入剧情</button>
      </article>
    </section>
  );
}
