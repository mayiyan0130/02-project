import { useMemo, useState } from 'react';
import { PalaceStatusBar } from '../components/status/PalaceStatusBar';
import { AttributeScene } from './components/AttributeScene';
import { ActivityScene } from './components/ActivityScene';
import { BriefingScene } from './components/BriefingScene';
import { DialogueScene } from './components/DialogueScene';
import { MapScene } from './components/MapScene';
import { MenuScene } from './components/MenuScene';
import { useGameFlowStore } from './store/gameFlowStore';
import type { SceneId } from './types';

const sceneOrder: SceneId[] = ['menu', 'attribute', 'briefing', 'dialogue', 'activity', 'map'];

export function GameApp() {
  const scene = useGameFlowStore((state) => state.scene);
  const setScene = useGameFlowStore((state) => state.setScene);
  const [message, setMessage] = useState('');

  const headerLabel = useMemo(() => {
    const current = sceneOrder.indexOf(scene);
    return `第 ${current + 1} / ${sceneOrder.length} 阶段`;
  }, [scene]);

  return (
    <main className="gal-root">
      <div className="gal-frame">
        <canvas className="gal-canvas" aria-hidden="true" width={1600} height={900} />
        <div className="gal-topline">
          <span>凤华录</span>
          <span>{headerLabel}</span>
        </div>
        {scene !== 'menu' && scene !== 'attribute' ? <PalaceStatusBar /> : null}
        {message ? <div className="gal-toast">{message}</div> : null}
        {scene === 'menu' ? <MenuScene onNotice={setMessage} /> : null}
        {scene === 'attribute' ? <AttributeScene onNotice={setMessage} /> : null}
        {scene === 'briefing' ? <BriefingScene onNotice={setMessage} /> : null}
        {scene === 'dialogue' ? <DialogueScene onNotice={setMessage} /> : null}
        {scene === 'activity' ? <ActivityScene onNotice={setMessage} /> : null}
        {scene === 'map' ? <MapScene onNotice={setMessage} /> : null}
        {scene !== 'menu' ? (
          <button className="gal-back-button" type="button" onClick={() => setScene(sceneOrder[Math.max(sceneOrder.indexOf(scene) - 1, 0)])}>
            返回上一步
          </button>
        ) : null}
      </div>
    </main>
  );
}
