import { mapAreas } from '../data/config';
import { gameApi } from '../lib/gameApi';
import { useGameFlowStore } from '../store/gameFlowStore';

interface MapSceneProps {
  onNotice: (message: string) => void;
}

export function MapScene({ onNotice }: MapSceneProps) {
  const { state, mapEventText, patchState, setMapEventText, setScene } = useGameFlowStore();

  const enterArea = async (area: string) => {
    try {
      const result = await gameApi.applyMapEvent(state, area as never);
      patchState(result.state);
      setMapEventText(result.text);
      onNotice(`已前往 ${area}`);
    } catch (error) {
      onNotice(error instanceof Error ? error.message : '地图事件触发失败。');
    }
  };

  return (
    <section className="gal-scene gal-scene--map" style={{ backgroundImage: "url('/assets/ui/palace-map.png')" }}>
      <div className="gal-overlay gal-overlay--map" />
      <div className="gal-map-panel">
        <header>
          <h2>皇宫地图</h2>
          <div className="gal-map-actions">
            <button type="button" onClick={() => setScene('dialogue')}>回剧情</button>
            <button type="button" onClick={() => setScene('activity')}>回寝殿</button>
          </div>
        </header>
        <div className="gal-map-grid">
          {mapAreas.map((area) => (
            <button key={area} type="button" onClick={() => enterArea(area)}>{area}</button>
          ))}
        </div>
        <p>{mapEventText || '请选择一处宫廷区域，触发对应事件链。'}</p>
      </div>
    </section>
  );
}
