import { useMemo, useState } from 'react';
import { PalaceDialogueBox } from '../components/dialogue/PalaceDialogueBox';
import { PalaceStatusBar } from '../components/status/PalaceStatusBar';
import { MAP_GUIDE_LINES, MAP_HOTSPOTS, MAP_SIDEBAR_BUTTONS } from '../config/palaceUi';
import { useGameFlowStore } from '../game/store/gameFlowStore';

export function MapMainView() {
  const {
    state,
    mapEventText,
    openChamberPanel,
    setMapEventText,
    patchState,
    advanceTime,
    enterMainChamber,
  } = useGameFlowStore();
  const [guideStep, setGuideStep] = useState(0);
  const [selectedHotspotId, setSelectedHotspotId] = useState<(typeof MAP_HOTSPOTS)[number]['id'] | null>(null);
  const guideActive = !state.flags.mapGuideFinished;

  const selectedHotspot = useMemo(
    () => MAP_HOTSPOTS.find((hotspot) => hotspot.id === selectedHotspotId) ?? null,
    [selectedHotspotId],
  );

  const dialogueText = useMemo(() => {
    if (guideActive) {
      return MAP_GUIDE_LINES[Math.min(guideStep, MAP_GUIDE_LINES.length - 1)];
    }
    if (selectedHotspot) {
      return `${selectedHotspot.label}：${selectedHotspot.description}`;
    }
    if (mapEventText) {
      return mapEventText;
    }
    return '';
  }, [guideActive, guideStep, mapEventText, selectedHotspot]);

  const jumpToChamberPanel = (panelId: 'consorts' | 'stats' | 'chronicle' | 'bond' | 'main') => {
    enterMainChamber();
    if (panelId !== 'main') {
      openChamberPanel(panelId);
    }
  };

  const finishGuide = () => {
    patchState({
      flags: {
        ...state.flags,
        mapGuideFinished: true,
      },
    });
    setMapEventText('');
    enterMainChamber();
  };

  const handleSidebar = (buttonId: string) => {
    if (guideActive) {
      setMapEventText('先跟着娇娇把地图认熟，等回宫之后，再细看这些常驻入口。');
      return;
    }

    if (buttonId === 'return') {
      jumpToChamberPanel('main');
      return;
    }

    if (buttonId === 'consorts' || buttonId === 'stats' || buttonId === 'chronicle' || buttonId === 'bond') {
      jumpToChamberPanel(buttonId);
    }
  };

  const handleHotspot = (hotspotId: (typeof MAP_HOTSPOTS)[number]['id']) => {
    if (guideActive) {
      setMapEventText('先把地图和入口认熟，待会儿回寝殿后，娘娘再随时外出。');
      return;
    }
    setSelectedHotspotId(hotspotId);
  };

  const handleEnterHotspot = () => {
    if (!selectedHotspot) return;
    advanceTime(1);
    setSelectedHotspotId(null);
    setMapEventText('');

    if (selectedHotspot.id === '后宫') {
      enterMainChamber();
      openChamberPanel('harem');
      return;
    }

    enterMainChamber(selectedHotspot.id);
  };

  return (
    <main className="map-main palace-stage-shell">
      <div className="map-main__frame">
        <div className="map-main__background" />
        <PalaceStatusBar />

        <nav className="palace-sidebar palace-sidebar--map" aria-label="大地图常驻入口">
          {MAP_SIDEBAR_BUTTONS.map((button) => (
            <button
              key={button.id}
              type="button"
              className="palace-sidebar__diamond"
              style={{ top: button.top }}
              onClick={() => handleSidebar(button.id)}
            >
              <span>{button.label}</span>
            </button>
          ))}
        </nav>

        <section className="map-main__hotspot-layer" aria-label="宫廷地图">
          {MAP_HOTSPOTS.map((hotspot) => (
            <button
              key={hotspot.id}
              type="button"
              className={`map-main__hotspot ${hotspot.vertical ? 'is-vertical' : ''} ${
                hotspot.emphasis === 'large' ? 'is-large' : ''
              } ${selectedHotspotId === hotspot.id ? 'is-active' : ''}`}
              style={{
                top: hotspot.top,
                left: hotspot.left,
                width: hotspot.width,
                height: hotspot.height,
              }}
              onClick={() => handleHotspot(hotspot.id)}
            >
              <span>{hotspot.label}</span>
            </button>
          ))}
        </section>

        {selectedHotspot ? (
          <section className="map-main__event-card" aria-label={`${selectedHotspot.label} 地点弹窗`}>
            <h2>{selectedHotspot.label}</h2>
            <p>{selectedHotspot.description}</p>
            <div className="map-main__event-actions">
              <button type="button" onClick={handleEnterHotspot}>
                进入此处
              </button>
              <button type="button" className="is-secondary" onClick={() => setSelectedHotspotId(null)}>
                留在地图
              </button>
            </div>
          </section>
        ) : null}

        {(dialogueText || guideActive) && !selectedHotspot ? (
          <PalaceDialogueBox
            ariaLabel="地图引导对话框"
            className="palace-dialogue-box--map"
            characterIdentity="贴身宫女"
            characterName="娇娇"
            content={dialogueText}
            nextActionLabel={guideActive ? (guideStep >= MAP_GUIDE_LINES.length - 1 ? '回宫' : '继续') : '收起'}
            onNextAction={() => {
              if (guideActive) {
                if (guideStep >= MAP_GUIDE_LINES.length - 1) {
                  finishGuide();
                } else {
                  setGuideStep((current) => current + 1);
                }
                return;
              }
              setMapEventText('');
            }}
          />
        ) : null}
      </div>
    </main>
  );
}
