import { useMemo, useState } from 'react';
import { AutoCutoutPortrait } from '../components/visual/AutoCutoutPortrait';
import { GlobalDialogueStage } from '../components/dialogue/GlobalDialogueStage';
import { PalaceStatusBar } from '../components/status/PalaceStatusBar';
import type { ChamberPanelId } from '../config/bedchamber';
import { LOCATION_SCENE_BACKGROUNDS } from '../config/locationSceneBackgrounds';
import { MAP_GUIDE_LINES, MAP_HOTSPOTS, MAP_SIDEBAR_BUTTONS } from '../config/palaceUi';
import { buildDuNiangShopCatalog, getInventoryRecyclePrice, type DuNiangShopEntry } from '../game/data/inventoryPresets';
import { canAccessHotSpringByPrestige } from '../game/lib/rankRuntime';
import { useGameFlowStore } from '../game/store/gameFlowStore';
import type { AffairSourceLabel } from '../game/types';

type GongmenNpcId = 'du-niang' | 'aling';
type GongmenTradeMode = 'buy' | 'sell';
type HotspotQuickAction =
  | {
      id: string;
      label: string;
      summary: string;
      kind: 'panel';
      panelId: ChamberPanelId;
    }
  | {
      id: string;
      label: string;
      summary: string;
      kind: 'affairs';
      affairsSource: AffairSourceLabel;
    };

const gongmenNpcProfiles: Record<
  GongmenNpcId,
  {
    identity: string;
    name: string;
    portrait: string;
    dialogueLines: string[];
    alreadyCutout?: boolean;
    portraitThreshold?: number;
    portraitSampleInset?: number;
  }
> = {
  'du-niang': {
    identity: '宫门商贩',
    name: '杜娘',
    portrait: '/assets/characters/women/杜娘.png',
    dialogueLines: [
      '杜娘立在宫门阴影下，拢着袖子含笑看你：“娘娘今日来得巧，我这边正好带了两匣新货。要买现成物件，还是把旧物折成银两，都好商量。”',
      '她抬手轻轻拨开箱笼，露出里面整齐叠好的香囊与药瓶：“宫里走动，人情往来最费银子。娘娘若有看中的，直说便是。”',
    ],
    alreadyCutout: true,
  },
  aling: {
    identity: '故国旧识',
    name: '阿翎',
    portrait: '/assets/characters/women/阿翎.jpg',
    dialogueLines: [
      '阿翎隔着宫门风声望着你，嗓音仍旧低而稳：“我会留在这里。你若想问故国近况，或只是想同旧人说几句话，我都听着。”',
      '她目光落在你袖口片刻，又慢慢收回去：“宫门人多眼杂，你若不便久留，我也会替你继续盯着外头的消息。”',
    ],
    portraitThreshold: 42,
  },
};
const ASSISTANT_PORTRAIT_SRC = '/assets/dialogue/jiaojiao-final.png';

export function MapMainView() {
  const {
    state,
    time,
    inventory,
    merchantLedger,
    mapEventText,
    openChamberPanel,
    setMapEventText,
    setActiveAffairsSource,
    patchState,
    advanceTime,
    enterMainChamber,
    buyInventoryItem,
    sellInventoryItem,
  } = useGameFlowStore();
  const [guideStep, setGuideStep] = useState(0);
  const [selectedHotspotId, setSelectedHotspotId] = useState<(typeof MAP_HOTSPOTS)[number]['id'] | null>(null);
  const [gongmenSceneActive, setGongmenSceneActive] = useState(false);
  const [activeGongmenNpc, setActiveGongmenNpc] = useState<GongmenNpcId | null>(null);
  const [activeTradeMode, setActiveTradeMode] = useState<GongmenTradeMode | null>(null);
  const [gongmenFeedback, setGongmenFeedback] = useState('');
  const [gongmenDialogueStep, setGongmenDialogueStep] = useState(0);
  const guideActive = !state.flags.mapGuideFinished;

  const selectedHotspot = useMemo(
    () => MAP_HOTSPOTS.find((hotspot) => hotspot.id === selectedHotspotId) ?? null,
    [selectedHotspotId],
  );
  const selectedHotspotQuickActions = useMemo<HotspotQuickAction[]>(() => {
    if (!selectedHotspot) {
      return [];
    }

    switch (selectedHotspot.id) {
      case '后宫':
        return [
          { id: 'open-harem', label: '后宫总览', summary: '直接进入现有后宫总览。', kind: 'panel', panelId: 'harem' },
          { id: 'open-palace-affairs', label: '宫斗事务', summary: '直接进入现有宫斗事务面板。', kind: 'affairs', affairsSource: '宫斗事务' },
        ];
      case '御书房':
        return [
          { id: 'open-court-affairs', label: '朝堂事务', summary: '直接进入现有朝堂事务面板。', kind: 'affairs', affairsSource: '朝堂事务' },
        ];
      case '养心殿':
        return [
          { id: 'open-bond', label: '情缘管理', summary: '直接进入现有情缘面板。', kind: 'panel', panelId: 'bond' },
        ];
      case '冷宫':
        return [
          { id: 'open-cold-affairs', label: '宫斗事务', summary: '直接进入现有宫斗事务面板。', kind: 'affairs', affairsSource: '宫斗事务' },
          { id: 'open-chronicle', label: '旧案纪事', summary: '直接进入现有纪事面板。', kind: 'panel', panelId: 'chronicle' },
        ];
      default:
        return [];
    }
  }, [selectedHotspot]);
  const gongmenSeed = useMemo(
    () => `${state.routeId}:${time.year}-${time.month}-${time.xun}`,
    [state.routeId, time.month, time.xun, time.year],
  );
  const duNiangCatalog = useMemo(() => buildDuNiangShopCatalog(gongmenSeed), [gongmenSeed]);
  const gongmenNpcButtons = useMemo(
    () =>
      state.routeId === 'chenyuansucuo'
        ? [
            { id: 'du-niang' as const, label: '杜娘' },
            { id: 'aling' as const, label: '阿翎' },
          ]
        : [{ id: 'du-niang' as const, label: '杜娘' }],
    [state.routeId],
  );
  const sellableInventory = useMemo(
    () =>
      inventory
        .filter((item) => item.quantity > 0 && item.canRecycle !== false)
        .sort((left, right) => left.price - right.price),
    [inventory],
  );
  const resolvedTradeCatalog = useMemo(
    () =>
      duNiangCatalog
        .map((entry) => {
          const ledgerKey = `${time.year}-${time.month}-${time.xun}:${entry.itemId}`;
          const boughtCount = merchantLedger[ledgerKey] ?? 0;
          const remainingStock = entry.stock == null ? null : Math.max(0, entry.stock - boughtCount);
          return {
            ...entry,
            remainingStock,
          };
        })
        .filter((entry) => entry.remainingStock == null || entry.remainingStock > 0),
    [duNiangCatalog, merchantLedger, time.month, time.xun, time.year],
  );
  const activeNpcProfile = activeGongmenNpc ? gongmenNpcProfiles[activeGongmenNpc] : null;
  const showGongmenSelector = gongmenSceneActive && !activeNpcProfile;
  const gongmenDialogue = useMemo(() => {
    if (gongmenFeedback) {
      return gongmenFeedback;
    }
    if (!activeNpcProfile) {
      return '';
    }
    return activeNpcProfile.dialogueLines[Math.min(gongmenDialogueStep, activeNpcProfile.dialogueLines.length - 1)] ?? '';
  }, [activeNpcProfile, gongmenDialogueStep, gongmenFeedback]);
  const activeMapBackground = gongmenSceneActive ? LOCATION_SCENE_BACKGROUNDS['宫门'] : undefined;

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

  const resetGongmenScene = () => {
    setGongmenSceneActive(false);
    setActiveGongmenNpc(null);
    setActiveTradeMode(null);
    setGongmenFeedback('');
    setGongmenDialogueStep(0);
  };

  const jumpToChamberPanel = (panelId: 'consorts' | 'stats' | 'chronicle' | 'bond' | 'main') => {
    resetGongmenScene();
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
    resetGongmenScene();
    setSelectedHotspotId(hotspotId);
  };

  const handleEnterHotspot = () => {
    if (!selectedHotspot) return;

    if (selectedHotspot.id === '华清池' && !canAccessHotSpringByPrestige(state.prestige)) {
      setSelectedHotspotId(null);
      setMapEventText('小主，华清池乃是容华及以上位分方可享用之地，咱们还是先请回吧。');
      return;
    }

    advanceTime(1);
    setMapEventText('');

    if (selectedHotspot.id === '宫门') {
      setSelectedHotspotId(null);
      setGongmenSceneActive(true);
      return;
    }

    setSelectedHotspotId(null);

    if (selectedHotspot.id === '后宫') {
      enterMainChamber();
      openChamberPanel('harem');
      return;
    }

    enterMainChamber(selectedHotspot.id);
  };

  const handleOpenGongmenNpc = (npcId: GongmenNpcId) => {
    setActiveGongmenNpc(npcId);
    setActiveTradeMode(null);
    setGongmenFeedback('');
    setGongmenDialogueStep(0);
  };

  const handleHotspotQuickAction = (action: HotspotQuickAction) => {
    advanceTime(1);
    setSelectedHotspotId(null);
    setMapEventText('');
    resetGongmenScene();

    if (action.kind === 'affairs') {
      setActiveAffairsSource(action.affairsSource);
      enterMainChamber();
      openChamberPanel('affairs');
      return;
    }

    enterMainChamber();
    openChamberPanel(action.panelId);
  };

  const handleTradeModeChange = (mode: GongmenTradeMode) => {
    setActiveTradeMode(mode);
    setGongmenFeedback(mode === 'buy' ? '杜娘把货箱往前一推，示意你自己挑。' : '杜娘垂眼扫过你的背包，等着你开口回收。');
  };

  const handleBuyFromDuNiang = (entry: DuNiangShopEntry & { remainingStock: number | null }) => {
    const result = buyInventoryItem(entry, entry.remainingStock);
    setGongmenFeedback(result.message);
  };

  const handleSellToDuNiang = (itemId: string) => {
    const result = sellInventoryItem(itemId);
    setGongmenFeedback(result.message);
  };

  return (
    <main className="map-main palace-stage-shell">
      <div className="map-main__frame">
        <div
          className={`map-main__background ${gongmenSceneActive ? 'is-location-scene' : ''}`}
          style={activeMapBackground ? { backgroundImage: `url(${activeMapBackground})` } : undefined}
        />
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

        {!gongmenSceneActive ? (
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
        ) : null}

        {selectedHotspot ? (
          <section
            className={`map-main__event-card ${selectedHotspot.id === '宫门' ? 'map-main__event-card--gongmen' : ''}`}
            aria-label={`${selectedHotspot.label} 地点弹窗`}
          >
            <h2>{selectedHotspot.label}</h2>
            <p>{selectedHotspot.description}</p>
            <div className={`map-main__event-actions ${selectedHotspot.id === '宫门' ? 'map-main__event-actions--gongmen' : ''}`}>
              <button type="button" onClick={handleEnterHotspot}>
                进入此处
              </button>
              {selectedHotspotQuickActions.map((action) => (
                <button key={action.id} type="button" onClick={() => handleHotspotQuickAction(action)} title={action.summary}>
                  {action.label}
                </button>
              ))}
              <button type="button" className="is-secondary" onClick={() => setSelectedHotspotId(null)}>
                留在地图
              </button>
            </div>
          </section>
        ) : null}

        {showGongmenSelector ? (
          <section className="map-main__gongmen-selector" aria-label="宫门人物入口">
            <div className="map-main__gongmen-entry-buttons">
              {gongmenNpcButtons.map((npc) => (
                <button
                  key={npc.id}
                  type="button"
                  className={activeGongmenNpc === npc.id ? 'is-active' : ''}
                  onClick={() => handleOpenGongmenNpc(npc.id)}
                >
                  {npc.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="map-main__gongmen-return"
              onClick={() => {
                resetGongmenScene();
                setMapEventText('');
              }}
            >
              回到地图
            </button>
          </section>
        ) : null}

        {gongmenSceneActive && activeNpcProfile ? (
          <>
            <section className="map-main__gongmen-scene" aria-label={`${activeNpcProfile.name} 宫门场景`}>
              <GlobalDialogueStage
                sceneLabel={`${activeNpcProfile.name} 宫门对话场景`}
                portraitLabel={`${activeNpcProfile.name} 立绘`}
                portrait={
                  activeNpcProfile.alreadyCutout ? (
                    <img
                      src={activeNpcProfile.portrait}
                      alt={activeNpcProfile.name}
                      className="global-dialogue-stage__portrait-media global-dialogue-stage__portrait-media--gongmen"
                    />
                  ) : (
                    <AutoCutoutPortrait
                      src={activeNpcProfile.portrait}
                      alt={activeNpcProfile.name}
                      className="global-dialogue-stage__portrait-media global-dialogue-stage__portrait-media--gongmen"
                      threshold={activeNpcProfile.portraitThreshold}
                      sampleInset={activeNpcProfile.portraitSampleInset ?? 10}
                    />
                  )
                }
                ariaLabel={`${activeNpcProfile.name} 宫门对话`}
                className="global-dialogue-stage--gongmen global-dialogue-stage--with-side-panel"
                dialogueClassName="palace-dialogue-box--gongmen-npc"
                characterIdentity={activeNpcProfile.identity}
                characterName={activeNpcProfile.name}
                content={gongmenDialogue}
                nextActionLabel={
                  gongmenFeedback
                    ? '知道了'
                    : gongmenDialogueStep < activeNpcProfile.dialogueLines.length - 1
                      ? '下一句'
                      : '收起'
                }
                onNextAction={() => {
                  if (gongmenFeedback) {
                    setGongmenFeedback('');
                    return;
                  }
                  if (gongmenDialogueStep < activeNpcProfile.dialogueLines.length - 1) {
                    setGongmenDialogueStep((current) => current + 1);
                    return;
                  }
                  setActiveGongmenNpc(null);
                  setActiveTradeMode(null);
                  setGongmenFeedback('');
                  setGongmenDialogueStep(0);
                }}
              />
            </section>

            <aside className="map-main__gongmen-actions" aria-label={`${activeNpcProfile.name} 操作栏`}>
              {activeGongmenNpc === 'du-niang' ? (
                <>
                  <button type="button" className={activeTradeMode === 'buy' ? 'is-active' : ''} onClick={() => handleTradeModeChange('buy')}>
                    购买
                  </button>
                  <button type="button" className={activeTradeMode === 'sell' ? 'is-active' : ''} onClick={() => handleTradeModeChange('sell')}>
                    售卖
                  </button>
                  <p>杜娘负责宫门商店与旧物回收，交易即时结算，不额外消耗时辰与体力。</p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setGongmenFeedback('阿翎的宫门支线已挂上入口，后续具体对话与长期推进会继续接在这里。')
                    }
                  >
                    叙旧
                  </button>
                  <p>阿翎仅在尘缘夙错线出现，当前先保留宫门见面入口与立绘展示。</p>
                </>
              )}
            </aside>

            {activeGongmenNpc === 'du-niang' && activeTradeMode ? (
              <section className="map-main__trade-modal" role="dialog" aria-label={activeTradeMode === 'buy' ? '杜娘购买弹窗' : '杜娘售卖弹窗'}>
                <header className="map-main__trade-header">
                  <div>
                    <strong>{activeTradeMode === 'buy' ? '杜娘货单' : '背包回收'}</strong>
                    <span>{`当前银两：${state.silver}`}</span>
                  </div>
                  <button type="button" onClick={() => setActiveTradeMode(null)}>
                    收起
                  </button>
                </header>

                <div className="map-main__trade-list">
                  {activeTradeMode === 'buy' ? (
                    resolvedTradeCatalog.length > 0 ? (
                      resolvedTradeCatalog.map((entry) => (
                        <article key={entry.itemId} className="map-main__trade-card">
                          <div>
                            <h3>{entry.name}</h3>
                            <p>{entry.description}</p>
                            <span>{`售价：${entry.price}两`}</span>
                            <span>{entry.remainingStock == null ? '常备货' : `本旬余量：${entry.remainingStock}`}</span>
                          </div>
                          <button
                            type="button"
                            aria-label={`购买 ${entry.name}`}
                            disabled={state.silver < entry.price || entry.remainingStock === 0}
                            onClick={() => handleBuyFromDuNiang(entry)}
                          >
                            购买
                          </button>
                        </article>
                      ))
                    ) : (
                      <div className="map-main__trade-empty-state">杜娘这一旬没带出新的稀有货色，剩下的常备物件你已经看过了。</div>
                    )
                  ) : sellableInventory.length > 0 ? (
                    sellableInventory.map((item) => (
                      <article key={item.itemId} className="map-main__trade-card">
                        <div>
                          <h3>{item.name}</h3>
                          <p>{item.description}</p>
                          <span>{`持有：${item.quantity}`}</span>
                          <span>{`回收价：${getInventoryRecyclePrice(item)}两 / 份`}</span>
                        </div>
                        <button type="button" aria-label={`售卖 ${item.name}`} onClick={() => handleSellToDuNiang(item.itemId)}>
                          售卖
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className="map-main__trade-empty-state">背包里暂时没有可回收的物件。</div>
                  )}
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {(dialogueText || guideActive) && !selectedHotspot ? (
          <GlobalDialogueStage
            sceneLabel="地图引导场景"
            portraitLabel="娇娇立绘"
            portrait={<img src={ASSISTANT_PORTRAIT_SRC} alt="娇娇" className="global-dialogue-stage__portrait-media global-dialogue-stage__portrait-media--assistant" />}
            ariaLabel="地图引导对话框"
            className="global-dialogue-stage--map-guide global-dialogue-stage--assistant"
            dialogueClassName="palace-dialogue-box--map"
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
