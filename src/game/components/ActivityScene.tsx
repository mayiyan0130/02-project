import { bedchamberActivities } from '../data/config';
import { gameApi } from '../lib/gameApi';
import { useGameFlowStore } from '../store/gameFlowStore';

interface ActivitySceneProps {
  onNotice: (message: string) => void;
}

const npcList = [
  { name: '姚玲儿', rank: '贵妃', affinity: 32, power: 88 },
  { name: '柳仪芳', rank: '美人', affinity: 68, power: 42 },
  { name: '江晚晚', rank: '淑妃', affinity: 41, power: 73 },
];

export function ActivityScene({ onNotice }: ActivitySceneProps) {
  const { state, patchState, setSave, setScene } = useGameFlowStore();

  const runActivity = async (activity: string) => {
    try {
      const result = await gameApi.applyActivity(state, activity as never);
      patchState(result.state);
      setSave(result.save);
      if (activity === '离开寝居') {
        setScene('map');
      }
      onNotice(`已执行活动：${activity}`);
    } catch (error) {
      onNotice(error instanceof Error ? error.message : '寝殿活动执行失败。');
    }
  };

  return (
    <section className="gal-scene gal-scene--activity" style={{ backgroundImage: "url('/assets/ui/bedchamber-ui.png')" }}>
      <div className="gal-overlay gal-overlay--panel" />
      <aside className="gal-side-panel">
        <h3>妃嫔状态</h3>
        {npcList.map((npc) => (
          <article key={npc.name}>
            <strong>{npc.name}</strong>
            <span>位分 {npc.rank}</span>
            <span>好感 {npc.affinity}</span>
            <span>势力 {npc.power}</span>
          </article>
        ))}
      </aside>
      <div className="gal-activity-card">
        <header>
          <h2>寝殿回合</h2>
          <div>行动点 {state.actionPoints} / 压力 {state.stress}</div>
        </header>
        <div className="gal-activity-grid">
          {bedchamberActivities.map((activity) => (
            <button key={activity} type="button" onClick={() => runActivity(activity)}>
              {activity}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
