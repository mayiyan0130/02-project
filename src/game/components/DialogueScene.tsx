import { gameApi } from '../lib/gameApi';
import { useGameFlowStore } from '../store/gameFlowStore';

interface DialogueSceneProps {
  onNotice: (message: string) => void;
}

export function DialogueScene({ onNotice }: DialogueSceneProps) {
  const { dialogue, state, briefing, patchState, setSave, setDialogue, setScene } = useGameFlowStore();

  const choose = async (label: string) => {
    try {
      const applied = await gameApi.applyChoice(state, label);
      patchState(applied.state);
      setSave(applied.save);
      const next = await gameApi.getDialogueTurn(applied.state, briefing);
      setDialogue(next);
      onNotice(`已执行选项：${label}`);
    } catch (error) {
      onNotice(error instanceof Error ? error.message : '选项处理失败。');
    }
  };

  if (!dialogue) {
    return (
      <section className="gal-scene gal-scene--dialogue">
        <div className="gal-dialogue-box">暂无可显示对话。</div>
      </section>
    );
  }

  return (
    <section className="gal-scene gal-scene--dialogue" style={{ backgroundImage: "url('/assets/ui/main-menu.png')" }}>
      <div className="gal-overlay gal-overlay--dialogue" />
      <div className="gal-character gal-character--left" />
      <div className="gal-character gal-character--right" />
      <div className="gal-dialogue-box">
        <header>
          <strong>{dialogue.speaker}</strong>
          <div className="gal-dialogue-nav">
            <button type="button" onClick={() => setScene('activity')}>寝殿</button>
            <button type="button" onClick={() => setScene('map')}>地图</button>
          </div>
        </header>
        <p>{dialogue.text}</p>
        <div className="gal-dialogue-options">
          {dialogue.options.map((option) => (
            <button key={option.id} type="button" onClick={() => choose(option.label)}>
              <span>{option.label}</span>
              <small>{option.effectHint}</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
