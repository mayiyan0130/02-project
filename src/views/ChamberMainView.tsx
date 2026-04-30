import { useEffect, useMemo, useState } from 'react';
import { ConcubineListView } from '../components/consorts/ConcubineListView';
import { PalaceDialogueBox } from '../components/dialogue/PalaceDialogueBox';
import { PalaceStatusBar } from '../components/status/PalaceStatusBar';
import { CHAMBER_ACTION_BUTTONS, CHAMBER_BOTTOM_TOOLS, CHAMBER_SIDEBAR_BUTTONS } from '../config/palaceUi';
import { buildInitialBondProfile, BOND_INTERACTION_OPTIONS } from '../game/data/bondPresets';
import { getRarityColor } from '../game/lib/bedchamberRuntime';
import { requestRelationshipJudgementWithFallback } from '../game/lib/relationshipJudgeRuntime';
import { useGameFlowStore } from '../game/store/gameFlowStore';

const skillLabelMap: Record<string, string> = {
  poetry: '诗词',
  painting: '丹青',
  talent: '乐理',
  embroidery: '刺绣',
  medicine: '药理',
  politics: '政治',
};

const toneLabelMap = {
  friendly: '友好',
  flirt: '暧昧',
  cold: '冷淡',
  reject: '拒斥',
  neutral: '中性',
} as const;

const panelCopy: Record<string, { title: string; lines: string[] }> = {
  consorts: {
    title: '嫔妃',
    lines: ['此处将展示后宫嫔妃、宫殿分布与当前关系。', '后续会接入完整的妃嫔卡片、宠爱、好感与宫斗状态。'],
  },
  stats: {
    title: '查看',
    lines: ['此处会集中展示个人属性、位分、福德、压力与隐藏状态。', '目前右侧技能区已直接读取玩家实时数值。'],
  },
  chronicle: {
    title: '纪事',
    lines: ['此处会记录案件、寿命预警、怀孕、生子与路线大事。', '后续接入纪事树与案件追踪面板。'],
  },
  bond: {
    title: '情缘',
    lines: ['情缘面板现已接入关系判定接口。', 'AI 只负责判定语气倾向，真实加减与每旬上限仍由本地规则控制。'],
  },
  inventory: {
    title: '道具管理',
    lines: ['此处会收纳礼物、补品、丹药与关键事件道具。', '后续会接入颜色稀有度和赠礼/自用逻辑。'],
  },
  affairs: {
    title: '事务总览',
    lines: ['此处会承接宴席、宫斗、家族与朝堂事务。', '后续会分流到对应事务子页。'],
  },
  misc: {
    title: '其他信息',
    lines: ['此处会放置设置、存档、结局条件与预留系统入口。'],
  },
};

const bottomToolMessage: Record<string, string> = {
  举办宴席: '宴席入口已预留，后续会接入宫宴花费、来客与声望收益。',
  宫斗事务: '宫斗事务入口已预留，后续会接入造谣、下毒、调查与压案。',
  家族事务: '家族事务入口已预留，后续会接入家族接济、游说与父亲官职波动。',
  朝堂事务: '朝堂事务入口已预留，后续会接入政治、朝臣支持与夺位大事件。',
  皇嗣管理: '皇嗣管理入口已预留，后续会接入孩子成长、教育与立储判定。',
  查看属性: '查看属性入口已预留，后续会展开完整主副属性与隐藏值。',
  其他信息: '其他信息入口已预留，后续会放置设定、收集和帮助。',
  情缘管理: '情缘管理入口已接入最小可交互版本，后续会补齐完整关系树与剧情节点。',
};

const getCurrentXunKey = (year: number, month: number, xun: number): string => `${year}-${month}-${xun}`;

export function ChamberMainView() {
  const {
    state,
    hiddenStats,
    time,
    selectedRoute,
    activeChamberPanel,
    openChamberPanel,
    closeChamberPanel,
    applyStoryEffects,
    advanceTime,
    patchState,
    enterMapMain,
    bondProfile,
    ensureBondProfile,
    concubines,
    ensureConcubines,
    applyBondJudgement,
  } = useGameFlowStore();
  const [dialogueText, setDialogueText] = useState('');
  const [bondBusy, setBondBusy] = useState(false);

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

    if (activeChamberPanel === 'main') {
      setDialogueText('');
    }
  }, [activeChamberPanel, patchState, state.flags, state.residenceName]);

  const skillStats = useMemo(
    () =>
      ['poetry', 'painting', 'talent', 'embroidery', 'medicine', 'politics'].map((key) => ({
        key,
        label: skillLabelMap[key],
        value: Math.round(Number(state.stats[key] ?? 0) * 10),
      })),
    [state.stats],
  );

  const panelContent = activeChamberPanel !== 'main' ? panelCopy[activeChamberPanel] : undefined;
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
      if (buttonId === 'consorts') {
        setDialogueText('');
      } else {
        setDialogueText(panelCopy[buttonId].lines[0]);
      }
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

  const handleBondOption = async (optionId: string) => {
    const option = BOND_INTERACTION_OPTIONS.find((item) => item.id === optionId);
    if (!option || bondBusy) {
      return;
    }

    setBondBusy(true);
    try {
      const judgement = await requestRelationshipJudgementWithFallback(
        {
          routeId: state.routeId,
          npcId: activeBondProfile.npcId,
          sceneType: activeBondProfile.sceneType,
          optionText: option.label,
          npcProfile: `${activeBondProfile.title}。${activeBondProfile.summary}`,
          currentFavor: activeBondProfile.favor,
          currentAffection: activeBondProfile.affection,
          recentContext: activeBondProfile.recentContext,
        },
        option.fallbackToneTag,
      );

      const favorCapHit =
        judgement.favorDelta !== 0 &&
        bondFavorDeltaThisXun === 5 * Math.sign(judgement.favorDelta);
      const affectionCapHit =
        judgement.affectionDelta !== 0 &&
        bondAffectionDeltaThisXun === 5 * Math.sign(judgement.affectionDelta);

      applyBondJudgement(judgement);
      setDialogueText(
        favorCapHit || affectionCapHit
          ? `${activeBondProfile.npcName}已听见这句，但本旬该方向的关系波动已到上限。`
          : `${activeBondProfile.npcName}记下了你的语气：${judgement.reason}`,
      );
    } finally {
      setBondBusy(false);
    }
  };

  const handleBottomTool = (toolLabel: string) => {
    if (toolLabel === '道具管理') {
      openChamberPanel('inventory');
      setDialogueText(panelCopy.inventory.lines[0]);
      return;
    }

    if (toolLabel === '查看属性') {
      openChamberPanel('stats');
      setDialogueText(panelCopy.stats.lines[0]);
      return;
    }

    if (toolLabel === '其他信息') {
      openChamberPanel('misc');
      setDialogueText(panelCopy.misc.lines[0]);
      return;
    }

    if (toolLabel === '情缘管理') {
      openChamberPanel('bond');
      setDialogueText(panelCopy.bond.lines[0]);
      return;
    }

    if (toolLabel === '宫斗事务' || toolLabel === '家族事务' || toolLabel === '朝堂事务') {
      openChamberPanel('affairs');
      setDialogueText(bottomToolMessage[toolLabel]);
      return;
    }

    setDialogueText(bottomToolMessage[toolLabel] ?? `${toolLabel}入口已预留，后续会补全对应功能。`);
  };

  return (
    <main className="chamber-main palace-stage-shell">
      <div className="chamber-main__frame">
        <div className="chamber-main__background" />
        <div className="chamber-main__inner-panel" aria-hidden="true" />
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

        <section className="chamber-main__title-bar" aria-label="玩家信息">
          <div className="chamber-main__title-chip">{`${hiddenStats.initialRank ?? '宫妃'} ${state.name}`}</div>
          <div className="chamber-main__residence-chip">{state.residenceName}</div>
        </section>

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

        {activeChamberPanel === 'consorts' ? (
          <ConcubineListView concubines={concubines} onClose={closeChamberPanel} />
        ) : activeChamberPanel === 'bond' ? (
          <section className="chamber-main__overlay-card chamber-main__overlay-card--bond" aria-label="情缘面板">
            <header>
              <h2>情缘</h2>
              <button type="button" onClick={closeChamberPanel}>
                收起
              </button>
            </header>
            <div className="chamber-main__bond-header">
              <div>
                <span>当前对象</span>
                <strong>{activeBondProfile.npcName}</strong>
              </div>
              <div>
                <span>情境</span>
                <strong>{activeBondProfile.sceneType}</strong>
              </div>
              <div>
                <span>定位</span>
                <strong>{activeBondProfile.title}</strong>
              </div>
            </div>
            <p className="chamber-main__bond-summary">{activeBondProfile.summary}</p>
            <div className="chamber-main__bond-stats">
              <article>
                <span>好感</span>
                <strong>{activeBondProfile.favor}</strong>
                <small>{`本旬净变动 ${bondFavorDeltaThisXun >= 0 ? '+' : ''}${bondFavorDeltaThisXun} / 5`}</small>
              </article>
              <article>
                <span>倾情</span>
                <strong>{activeBondProfile.affection}</strong>
                <small>{`本旬净变动 ${bondAffectionDeltaThisXun >= 0 ? '+' : ''}${bondAffectionDeltaThisXun} / 5`}</small>
              </article>
            </div>
            <div className="chamber-main__bond-actions">
              {BOND_INTERACTION_OPTIONS.map((option) => (
                <button key={option.id} type="button" onClick={() => handleBondOption(option.id)} disabled={bondBusy}>
                  <strong>{option.label}</strong>
                  <span>{option.summary}</span>
                </button>
              ))}
            </div>
            <div className="chamber-main__bond-result" aria-live="polite">
              <p>
                {activeBondProfile.lastToneTag
                  ? `最近判定：${toneLabelMap[activeBondProfile.lastToneTag]} · ${activeBondProfile.lastSource === 'ai' ? 'AI 返回' : '本地回退'}`
                  : '尚未进行关系判定。'}
              </p>
              <p>{activeBondProfile.lastReason ?? '当前只开放最小交互版，真实关系变化仍由本地规则控制。'}</p>
            </div>
          </section>
        ) : panelContent ? (
          <section className="chamber-main__overlay-card" aria-label={`${panelContent.title} 面板`}>
            <header>
              <h2>{panelContent.title}</h2>
              <button type="button" onClick={closeChamberPanel}>
                收起
              </button>
            </header>
            <div className="chamber-main__overlay-copy">
              {panelContent.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>
        ) : null}

        {dialogueText && activeChamberPanel !== 'consorts' ? (
          <PalaceDialogueBox
            ariaLabel="寝殿对白"
            className="palace-dialogue-box--chamber"
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
