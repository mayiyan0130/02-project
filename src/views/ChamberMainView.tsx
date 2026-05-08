import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { AffairsPanelView, BondPanelView, ChroniclePanelView, InventoryPanelView, MiscInfoPanelView } from '../components/chamber/ChamberUtilityViews';
import { BaohuaHallView } from '../components/chamber/BaohuaHallView';
import { DowagerAudiencePanel } from '../components/chamber/DowagerAudiencePanel';
import { KitchenView } from '../components/chamber/KitchenView';
import { TaiHospitalView } from '../components/chamber/TaiHospitalView';
import { ConcubineListView } from '../components/consorts/ConcubineListView';
import { HaremPalaceView } from '../components/consorts/HaremPalaceView';
import { GlobalDialogueStage } from '../components/dialogue/GlobalDialogueStage';
import { PalaceStatusBar } from '../components/status/PalaceStatusBar';
import { PlayerStatsView } from '../components/status/PlayerStatsView';
import { CHAMBER_ACTION_BUTTONS, CHAMBER_BOTTOM_TOOLS, CHAMBER_SIDEBAR_BUTTONS } from '../config/palaceUi';
import { LOCATION_SCENE_BACKGROUNDS } from '../config/locationSceneBackgrounds';
import { buildInitialBondProfile } from '../game/data/bondPresets';
import { getRarityColor } from '../game/lib/bedchamberRuntime';
import { useGameFlowStore } from '../game/store/gameFlowStore';

const skillLabelMap: Record<string, string> = {
  poetry: '诗词',
  painting: '丹青',
  talent: '乐理',
  embroidery: '刺绣',
  medicine: '药理',
  politics: '政治',
};

const bottomToolMessage: Record<string, string> = {
  举办宴席: '宴席入口已预留，后续会接入宫宴花费、来客与声望收益。',
  皇嗣管理: '皇嗣管理入口已预留，后续会接入孩子成长、教育与立储判定。',
};
const ASSISTANT_PORTRAIT_SRC = '/assets/dialogue/jiaojiao-final.png';

const getCurrentXunKey = (year: number, month: number, xun: number): string => `${year}-${month}-${xun}`;

export function ChamberMainView() {
  const {
    state,
    hiddenStats,
    time,
    selectedRoute,
    activeChamberPanel,
    activeMapLocation,
    activeAffairsSource,
    openChamberPanel,
    closeChamberPanel,
    applyStoryEffects,
    advanceTime,
    patchState,
    enterMapMain,
    setActiveAffairsSource,
    bondProfile,
    ensureBondProfile,
    concubines,
    ensureConcubines,
  } = useGameFlowStore();
  const [dialogueText, setDialogueText] = useState('');
  const isOutsideScene = Boolean(activeMapLocation);
  const isJianzhangAudience = activeChamberPanel === 'main' && activeMapLocation === '建章宫';
  const isKitchenScene = activeChamberPanel === 'main' && activeMapLocation === '御膳房';
  const isBaohuaHallScene = activeChamberPanel === 'main' && activeMapLocation === '宝华殿';
  const isTaiHospitalScene = activeChamberPanel === 'main' && activeMapLocation === '太医院';
  const isHaremPanelActive = activeChamberPanel === 'harem';
  const isFullSurfacePanel = activeChamberPanel !== 'main';
  const showResidenceUi = !isOutsideScene && !isFullSurfacePanel;
  const currentSceneLabel = isHaremPanelActive ? '后宫' : activeMapLocation ?? state.residenceName;
  const currentSceneBackground = activeMapLocation ? LOCATION_SCENE_BACKGROUNDS[activeMapLocation] : undefined;
  const chamberBackgroundStyle = useMemo<CSSProperties | undefined>(
    () =>
      currentSceneBackground
        ? {
            backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02)), url("${currentSceneBackground}")`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
          }
        : undefined,
    [currentSceneBackground],
  );

  useEffect(() => {
    ensureBondProfile(state.routeId);
    ensureConcubines(state.routeId);
  }, [ensureBondProfile, ensureConcubines, state.routeId]);

  useEffect(() => {
    if (!state.flags.bedchamberIntroShown) {
      setDialogueText(`娘娘，咱们已回到${state.residenceName}。接下来您可以安排学习、休养，也可外出继续探看宫中各处。`);
      patchState({
        flags: {
          ...state.flags,
          bedchamberIntroShown: true,
        },
      });
      return;
    }

    if (activeChamberPanel !== 'main') {
      setDialogueText('');
      return;
    }

    if (activeMapLocation === '建章宫' || activeMapLocation === '御膳房' || activeMapLocation === '宝华殿' || activeMapLocation === '太医院') {
      setDialogueText('');
      return;
    }

    if (activeMapLocation) {
      setDialogueText(`娘娘，我们已到${activeMapLocation}。此处场景已切换为对应地点背景。`);
      return;
    }

    if (activeChamberPanel === 'main') {
      setDialogueText('');
    }
  }, [activeChamberPanel, activeMapLocation, patchState, state.flags, state.residenceName]);

  const skillStats = useMemo(
    () =>
      ['poetry', 'painting', 'talent', 'embroidery', 'medicine', 'politics'].map((key) => ({
        key,
        label: skillLabelMap[key],
        value: Math.round(Number(state.stats[key] ?? 0) * 10),
      })),
    [state.stats],
  );

  const currentXunKey = getCurrentXunKey(time.year, time.month, time.xun);
  const activeBondProfile =
    bondProfile.routeId === state.routeId ? bondProfile : buildInitialBondProfile(state.routeId, currentXunKey);
  const bondFavorDeltaThisXun = activeBondProfile.xunKey === currentXunKey ? activeBondProfile.favorDeltaThisXun : 0;
  const bondAffectionDeltaThisXun = activeBondProfile.xunKey === currentXunKey ? activeBondProfile.affectionDeltaThisXun : 0;

  const handleSidebar = (buttonId: string) => {
    if (buttonId === 'map-main') {
      enterMapMain();
      return;
    }

    if (buttonId === 'consorts' || buttonId === 'stats' || buttonId === 'chronicle' || buttonId === 'bond') {
      if (activeChamberPanel === buttonId) {
        closeChamberPanel();
        return;
      }
      openChamberPanel(buttonId);
      setDialogueText('');
    }
  };

  const handleTrainingAction = (actionId: string) => {
    const action = CHAMBER_ACTION_BUTTONS.find((item) => item.id === actionId);
    if (!action) return;

    if (action.id === 'explore') {
      enterMapMain();
      return;
    }

    if (action.id === 'end-xun') {
      advanceTime(Math.max(1, 7 - time.slotIndex));
      setDialogueText('这一旬先告一段落，已转入下一旬清晨，体力按次日口径重新结算。');
      return;
    }

    if ((action.staminaCost ?? 0) > state.stamina) {
      setDialogueText('娘娘眼下体力不足，还是先歇一歇，再做这些事。');
      return;
    }

    applyStoryEffects({
      stamina: -(action.staminaCost ?? 0),
      favor: action.favorDelta ?? 0,
      stress: action.stressDelta ?? 0,
      stats: action.statDeltas ?? {},
    });
    advanceTime(action.timeCost ?? 1);
    setDialogueText(`${action.label}已记入今日行程。${action.summary}`);
  };

  const handleBottomTool = (toolLabel: string) => {
    if (toolLabel === '道具管理') {
      openChamberPanel('inventory');
      setDialogueText('');
      return;
    }

    if (toolLabel === '查看属性') {
      openChamberPanel('stats');
      setDialogueText('');
      return;
    }

    if (toolLabel === '其他信息') {
      openChamberPanel('misc');
      setDialogueText('');
      return;
    }

    if (toolLabel === '情缘管理') {
      openChamberPanel('bond');
      setDialogueText('');
      return;
    }

    if (toolLabel === '宫斗事务' || toolLabel === '家族事务' || toolLabel === '朝堂事务') {
      setActiveAffairsSource(toolLabel);
      openChamberPanel('affairs');
      setDialogueText('');
      return;
    }

    setDialogueText(bottomToolMessage[toolLabel] ?? `${toolLabel}入口已预留，后续会补全对应功能。`);
  };

  return (
    <main className={`chamber-main palace-stage-shell ${isHaremPanelActive ? 'is-harem-open' : ''}`}>
      <div className="chamber-main__frame">
        <div className="chamber-main__background" style={chamberBackgroundStyle} />
        {showResidenceUi ? <div className="chamber-main__inner-panel" aria-hidden="true" /> : null}
        <PalaceStatusBar />

        <nav className="palace-sidebar palace-sidebar--chamber" aria-label="寝殿左侧功能栏">
          {CHAMBER_SIDEBAR_BUTTONS.map((button) => (
            <button
              key={button.id}
              type="button"
              className={`palace-sidebar__diamond ${activeChamberPanel === button.id ? 'is-active' : ''}`}
              style={{ top: button.top }}
              onClick={() => handleSidebar(button.id)}
            >
              <span>{button.label}</span>
            </button>
          ))}
        </nav>

        {showResidenceUi ? (
          <section className="chamber-main__title-bar" aria-label="玩家信息">
            <div className="chamber-main__title-chip">{`${hiddenStats.initialRank ?? '宫妃'} ${state.name}`}</div>
            <div className="chamber-main__residence-chip">{currentSceneLabel}</div>
          </section>
        ) : null}

        {showResidenceUi ? (
          <>
            <section className="chamber-main__portrait-stage" aria-label="玩家立绘">
              {selectedRoute ? <img src={selectedRoute.portrait} alt={selectedRoute.label} className="chamber-main__portrait" /> : null}
            </section>

            <section className="chamber-main__skill-panel" aria-label="技能与行动">
              <div className="chamber-main__skills">
                {skillStats.map((skill) => (
                  <div key={skill.key} className="chamber-main__skill-item">
                    <span>{skill.label}</span>
                    <strong style={{ color: getRarityColor(skill.value, 100) }}>{skill.value}</strong>
                  </div>
                ))}
              </div>

              <div className="chamber-main__action-grid">
                {CHAMBER_ACTION_BUTTONS.map((action) => (
                  <button key={action.id} type="button" onClick={() => handleTrainingAction(action.id)}>
                    {action.label}
                  </button>
                ))}
              </div>

              <div className="chamber-main__bottom-tools">
                {CHAMBER_BOTTOM_TOOLS.map((tool) => (
                  <button key={tool} type="button" onClick={() => handleBottomTool(tool)}>
                    {tool}
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {isKitchenScene ? (
          <KitchenView concubines={concubines} />
        ) : isBaohuaHallScene ? (
          <BaohuaHallView concubines={concubines} />
        ) : isTaiHospitalScene ? (
          <TaiHospitalView concubines={concubines} />
        ) : isJianzhangAudience ? (
          <DowagerAudiencePanel onLeave={enterMapMain} />
        ) : activeChamberPanel === 'harem' ? (
          <HaremPalaceView concubines={concubines} />
        ) : activeChamberPanel === 'chronicle' ? (
          <ChroniclePanelView time={time} state={state} hiddenStats={hiddenStats} onClose={closeChamberPanel} />
        ) : activeChamberPanel === 'bond' ? (
          <BondPanelView
            bondProfile={activeBondProfile}
            concubines={concubines}
            routeId={state.routeId}
            flags={state.flags}
            bondFavorDeltaThisXun={bondFavorDeltaThisXun}
            bondAffectionDeltaThisXun={bondAffectionDeltaThisXun}
            onClose={closeChamberPanel}
          />
        ) : activeChamberPanel === 'inventory' ? (
          <InventoryPanelView onClose={closeChamberPanel} />
        ) : activeChamberPanel === 'affairs' ? (
          <AffairsPanelView entrySource={activeAffairsSource} concubines={concubines} onClose={closeChamberPanel} />
        ) : activeChamberPanel === 'misc' ? (
          <MiscInfoPanelView state={state} hiddenStats={hiddenStats} bondProfile={activeBondProfile} onClose={closeChamberPanel} />
        ) : activeChamberPanel === 'stats' ? (
          <PlayerStatsView
            state={state}
            hiddenStats={hiddenStats}
            selectedRoute={selectedRoute}
            concubines={concubines}
            onClose={closeChamberPanel}
          />
        ) : activeChamberPanel === 'consorts' ? (
          <ConcubineListView concubines={concubines} onClose={closeChamberPanel} />
        ) : null}

        {dialogueText && activeChamberPanel === 'main' && !isJianzhangAudience && !isBaohuaHallScene && !isTaiHospitalScene ? (
          <GlobalDialogueStage
            sceneLabel="寝殿指引场景"
            portraitLabel="娇娇立绘"
            portrait={<img src={ASSISTANT_PORTRAIT_SRC} alt="娇娇" className="global-dialogue-stage__portrait-media global-dialogue-stage__portrait-media--assistant" />}
            ariaLabel="寝殿对白"
            className="global-dialogue-stage--chamber-guide global-dialogue-stage--assistant"
            dialogueClassName="palace-dialogue-box--chamber"
            characterIdentity="贴身宫女"
            characterName="娇娇"
            content={dialogueText}
            nextActionLabel="收起"
            onNextAction={() => setDialogueText('')}
          />
        ) : null}
      </div>
    </main>
  );
}
