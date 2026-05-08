import { useEffect, useMemo, useState } from 'react';
import { GlobalDialogueStage } from '../dialogue/GlobalDialogueStage';
import {
  getConcubineConditionLabel,
  getConcubineDisplayRankText,
  getConcubinePortraitPath,
  getConcubineRankWeightByLabel,
} from '../../game/data/concubineRoster';
import { requestConsortDialogueWithFallback } from '../../game/lib/consortDialogueRuntime';
import { requestRelationshipJudgementWithFallback } from '../../game/lib/relationshipJudgeRuntime';
import { useGameFlowStore } from '../../game/store/gameFlowStore';
import type {
  ConcubineProfile,
  ConsortDialogueOption,
  ConsortDialogueTurn,
  ConsortPalaceActionId,
  InventoryItem,
} from '../../game/types';

interface ConsortAudiencePanelProps {
  consort: ConcubineProfile;
  palaceLabel: string;
  hallLabel: string;
  concubines: ConcubineProfile[];
  onBack: () => void;
}

interface HistoryEntry {
  speaker: string;
  text: string;
}

const clampLocal = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const trimHistory = (history: HistoryEntry[]): HistoryEntry[] => history.slice(-6);

const appendUnique = (items: string[], value: string): string[] => (items.includes(value) ? items : [...items, value]);
const removeValue = (items: string[], value: string): string[] => items.filter((item) => item !== value);

const buildPlayerRankProxy = (consort: ConcubineProfile, playerName: string, playerRankLabel: string, playerPrestige: number): ConcubineProfile => ({
  ...consort,
  id: 'player-rank-proxy',
  portraitId: consort.portraitId,
  name: playerName,
  rankLabel: playerRankLabel,
  residence: consort.residence,
  stateLabel: '寻常',
  familyBackground: consort.familyBackground,
  personality: consort.personality,
  summary: consort.summary,
  stats: {
    ...consort.stats,
    prestige: playerPrestige,
    relationToPlayer: 0,
    affection: 0,
  },
  allies: [],
  rivals: [],
});

const buildRelationLabel = (consort: ConcubineProfile): string => {
  if (consort.allies.includes('玩家')) {
    return '已交好';
  }
  if (consort.rivals.includes('玩家')) {
    return '交恶';
  }
  if (consort.stats.relationToPlayer >= 60) {
    return '关系亲近';
  }
  if (consort.stats.relationToPlayer >= 10) {
    return '关系平稳';
  }
  if (consort.stats.relationToPlayer > -20) {
    return '关系紧绷';
  }
  return '明显防备';
};

export function ConsortAudiencePanel({ consort, palaceLabel, hallLabel, concubines, onBack }: ConsortAudiencePanelProps) {
  const {
    state,
    hiddenStats,
    time,
    inventory,
    consumeInventoryItem,
    patchConcubineById,
    applyConsortRelationshipJudgement,
  } = useGameFlowStore();
  const [dialogueTurn, setDialogueTurn] = useState<ConsortDialogueTurn | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [actionId, setActionId] = useState<ConsortPalaceActionId>('visit');
  const [actionLabel, setActionLabel] = useState('入殿相见');
  const [sceneHint, setSceneHint] = useState('');
  const [pickerMode, setPickerMode] = useState<'gift' | 'smear' | null>(null);

  const displayRank = useMemo(() => getConcubineDisplayRankText(consort), [consort]);
  const portraitSrc = useMemo(() => getConcubinePortraitPath(consort.portraitId), [consort.portraitId]);

  const playerRankLabel = useMemo(() => {
    const initialRank = hiddenStats.initialRank;
    if (initialRank && getConcubineRankWeightByLabel(initialRank) > 0) {
      return initialRank;
    }

    const proxy = buildPlayerRankProxy(
      consort,
      state.name,
      initialRank === '和亲入宫' ? '妃' : initialRank ?? '官女子',
      state.prestige,
    );
    return getConcubineDisplayRankText(proxy);
  }, [consort, hiddenStats.initialRank, state.name, state.prestige]);

  const canPunish = useMemo(
    () => getConcubineRankWeightByLabel(playerRankLabel) > getConcubineRankWeightByLabel(displayRank),
    [displayRank, playerRankLabel],
  );

  const giftItems = useMemo(() => inventory.filter((item) => item.quantity > 0), [inventory]);
  const smearTargets = useMemo(
    () =>
      concubines.filter(
        (item) => item.status === 'live' && item.id !== consort.id && !item.name.includes('太后') && item.name !== '娇娇',
      ),
    [concubines, consort.id],
  );

  const dialogueOptions = pickerMode === null ? dialogueTurn?.options ?? [] : [];
  const currentStateLabel = getConcubineConditionLabel(consort);
  const relationLabel = buildRelationLabel(consort);

  const buildPayload = (
    activeConsort: ConcubineProfile,
    topic: 'visit' | 'action' | 'follow-up',
    nextActionId: string,
    nextActionLabel: string,
    overrides?: {
      actionResult?: string;
      selectedOptionId?: string;
      selectedOptionLabel?: string;
      giftItemName?: string;
      smearTargetName?: string;
      historyOverride?: HistoryEntry[];
    },
  ) => {
    const activeHistory = trimHistory(overrides?.historyOverride ?? history);

    return {
      routeId: state.routeId,
      playerName: state.name,
      playerRank: playerRankLabel,
      playerResidence: state.residenceName,
      playerOpeningTendency: state.openingTendency,
      canPunish,
      topic,
      actionId: nextActionId,
      actionLabel: nextActionLabel,
      actionResult: overrides?.actionResult,
      selectedOptionId: overrides?.selectedOptionId,
      selectedOptionLabel: overrides?.selectedOptionLabel,
      giftItemName: overrides?.giftItemName,
      smearTargetName: overrides?.smearTargetName,
      history: activeHistory,
      recentContext: activeHistory.map((entry) => `${entry.speaker}：${entry.text}`),
      playerContext: {
        favor: state.favor,
        stress: state.stress,
        prestige: state.prestige,
        trueHeart: state.trueHeart,
        silver: state.silver,
        stamina: state.stamina,
        stats: state.stats,
      },
      consortContext: {
        id: activeConsort.id,
        name: activeConsort.name,
        rank: getConcubineDisplayRankText(activeConsort),
        residence: activeConsort.residence,
        stateLabel: getConcubineConditionLabel(activeConsort),
        personality: activeConsort.personality,
        summary: activeConsort.summary,
        currentGoodwill: activeConsort.stats.relationToPlayer,
        currentAffection: activeConsort.stats.affection,
        emperorFavor: activeConsort.stats.favor,
        stress: activeConsort.stats.stress,
        allies: activeConsort.allies,
        rivals: activeConsort.rivals,
      },
      timeContext: time,
    } as const;
  };

  const runNarrativeTurn = async (
    activeConsort: ConcubineProfile,
    topic: 'visit' | 'action' | 'follow-up',
    nextActionId: ConsortPalaceActionId,
    nextActionLabel: string,
    overrides?: {
      actionResult?: string;
      selectedOptionId?: string;
      selectedOptionLabel?: string;
      giftItemName?: string;
      smearTargetName?: string;
      historyOverride?: HistoryEntry[];
    },
  ) => {
    const payload = buildPayload(activeConsort, topic, nextActionId, nextActionLabel, overrides);
    const nextTurn = await requestConsortDialogueWithFallback(payload, activeConsort);
    const speakerLabel = `${nextTurn.speakerIdentity} · ${nextTurn.speakerName}`;
    setDialogueTurn(nextTurn);
    setSceneHint(nextTurn.sceneHint ?? '');
    setHistory((currentHistory) => trimHistory([...(overrides?.historyOverride ?? currentHistory), { speaker: speakerLabel, text: nextTurn.text }]));
  };

  useEffect(() => {
    let disposed = false;

    const bootVisit = async () => {
      setBusy(true);
      setActionId('visit');
      setActionLabel('入殿相见');
      setPickerMode(null);
      setHistory([]);
      try {
        await runNarrativeTurn(consort, 'visit', 'visit', '入殿相见', {
          actionResult: `你已步入${palaceLabel}${hallLabel}，与${displayRank} ${consort.name}正面相见。`,
          historyOverride: [],
        });
      } finally {
        if (!disposed) {
          setBusy(false);
        }
      }
    };

    void bootVisit();

    return () => {
      disposed = true;
    };
  }, [consort.id, displayRank, hallLabel, palaceLabel]);

  const applyGift = async (item: InventoryItem) => {
    if (busy) {
      return;
    }
    const consumed = consumeInventoryItem(item.itemId);
    if (!consumed) {
      setSceneHint(`${item.name}已不在当前背包中。`);
      setPickerMode(null);
      return;
    }

    const nextConsort: ConcubineProfile = {
      ...consort,
      stats: {
        ...consort.stats,
        relationToPlayer: clampLocal(consort.stats.relationToPlayer + item.favorDelta, -100, 100),
        health: clampLocal(consort.stats.health + item.healthDelta, 0, 1000),
        appearance: clampLocal(consort.stats.appearance + item.appearanceDelta, 0, 1000),
        temperament: clampLocal(consort.stats.temperament + item.temperamentDelta, 0, 1000),
      },
    };

    patchConcubineById(consort.id, () => nextConsort);
    setBusy(true);
    setPickerMode(null);
    setActionId('gift');
    setActionLabel('送礼');

    try {
      await runNarrativeTurn(nextConsort, 'action', 'gift', '送礼', {
        actionResult: `${item.name}已送出。系统按礼物规则结算：对玩家好感 ${item.favorDelta >= 0 ? '+' : ''}${item.favorDelta}。`,
        giftItemName: item.name,
      });
    } finally {
      setBusy(false);
    }
  };

  const applySmear = async (target: ConcubineProfile) => {
    if (busy) {
      return;
    }

    const nextConsort: ConcubineProfile = {
      ...consort,
      allies: removeValue(consort.allies, target.name),
      rivals: appendUnique(consort.rivals, target.name),
    };

    patchConcubineById(consort.id, () => nextConsort);
    setBusy(true);
    setPickerMode(null);
    setActionId('smear');
    setActionLabel('抹黑');

    try {
      await runNarrativeTurn(nextConsort, 'action', 'smear', '抹黑', {
        actionResult: `你已向她抹黑${target.name}，系统将该目标写入她的交恶名单。`,
        smearTargetName: target.name,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleFixedAction = async (nextActionId: ConsortPalaceActionId, nextActionLabel: string) => {
    if (busy) {
      return;
    }

    if (nextActionId === 'gift') {
      setPickerMode('gift');
      setSceneHint(giftItems.length > 0 ? '从你当前持有的礼物中挑一件送出。' : '当前没有可送出的礼物。');
      return;
    }

    if (nextActionId === 'smear') {
      setPickerMode('smear');
      setSceneHint(smearTargets.length > 0 ? '选一位你想让她生出嫌隙的妃嫔。' : '当前没有可抹黑的其他妃嫔。');
      return;
    }

    if (nextActionId === 'punish' && !canPunish) {
      setSceneHint('只有你当前位分高于她时，责罚才可使用。');
      return;
    }

    setBusy(true);
    setPickerMode(null);
    setActionId(nextActionId);
    setActionLabel(nextActionLabel);

    let actionResult = '';
    let snapshot = consort;

    if (nextActionId === 'punish') {
      snapshot = {
        ...consort,
        allies: removeValue(consort.allies, '玩家'),
        rivals: appendUnique(consort.rivals, '玩家'),
        stats: {
          ...consort.stats,
          relationToPlayer: clampLocal(consort.stats.relationToPlayer - 4, -100, 100),
          stress: clampLocal(consort.stats.stress + 6, 0, 100),
        },
      };
      patchConcubineById(consort.id, () => snapshot);
      actionResult = '你已正式落下责罚，本地规则立即降低她对你的好感，并抬高她的压力。';
    } else if (nextActionId === 'win-over') {
      if (consort.stats.relationToPlayer >= 60) {
        snapshot = {
          ...consort,
          allies: appendUnique(removeValue(consort.allies, '玩家'), '玩家'),
          rivals: removeValue(consort.rivals, '玩家'),
        };
        patchConcubineById(consort.id, () => snapshot);
        actionResult = '她当前对你好感已达 60 以上，系统判定她愿与您交好。';
      } else if (consort.stats.relationToPlayer < 10) {
        actionResult = '她当前对你好感低于 10，不会答应与你交好。';
      } else {
        actionResult = '她并未立刻应下，只把态度暂时压在观望之间。';
      }
    } else if (nextActionId === 'quarrel') {
      actionResult = '你先把话锋压低半寸，却明显带了试探与冲撞的意思。';
    } else if (nextActionId === 'greet') {
      actionResult = '你先以日常问好开了口，局面仍留有缓和余地。';
    } else {
      actionResult = `你已选择${nextActionLabel}。`;
    }

    try {
      await runNarrativeTurn(snapshot, 'action', nextActionId, nextActionLabel, { actionResult });
    } finally {
      setBusy(false);
    }
  };

  const handleOptionSelect = async (optionId: string) => {
    if (busy || !dialogueTurn) {
      return;
    }

    const option = dialogueOptions.find((item) => item.id === optionId);
    if (!option) {
      return;
    }

    const nextHistory = trimHistory([...history, { speaker: `${playerRankLabel} · ${state.name}`, text: option.label }]);
    setBusy(true);

    try {
      const judgement = await requestRelationshipJudgementWithFallback(
        {
          routeId: state.routeId,
          npcId: consort.id,
          sceneType: `宫内拜访·${actionLabel}`,
          optionText: option.label,
          npcProfile: `${displayRank} ${consort.name}。${consort.summary}。性格：${consort.personality}`,
          currentFavor: consort.stats.relationToPlayer,
          currentAffection: consort.stats.affection,
          recentContext: nextHistory.map((entry) => `${entry.speaker}：${entry.text}`),
        },
        option.fallbackToneTag,
      );
      const summary = applyConsortRelationshipJudgement(consort.id, actionId, judgement);
      const nextConsort: ConcubineProfile = {
        ...consort,
        stats: {
          ...consort.stats,
          relationToPlayer: clampLocal(consort.stats.relationToPlayer + summary.appliedFavorDelta, -100, 100),
          affection: clampLocal(consort.stats.affection + summary.appliedAffectionDelta, 0, 100),
        },
      };

      const capNotice =
        summary.favorCapHit || summary.affectionCapHit ? '本旬该方向关系波动已到上限。' : '本地关系结算已按本旬上限落地。';

      await runNarrativeTurn(nextConsort, 'follow-up', actionId, actionLabel, {
        actionResult: `${judgement.reason} ${capNotice}`,
        selectedOptionId: option.id,
        selectedOptionLabel: option.label,
        historyOverride: nextHistory,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleNextLine = async () => {
    if (busy || !dialogueTurn || dialogueOptions.length > 0 || pickerMode !== null) {
      return;
    }

    if (dialogueTurn.phase === 'finish' || dialogueTurn.nextActionLabel !== '下一句') {
      onBack();
      return;
    }

    setBusy(true);

    try {
      await runNarrativeTurn(consort, 'follow-up', actionId, actionLabel, {
        actionResult: '你没有立刻表态，只示意她把话继续说下去。',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="harem-palace-view__audience" aria-label={`${displayRank} ${consort.name} 日常对话`}>
      <header className="harem-palace-view__audience-header">
        <div className="harem-palace-view__heading">
          <span>{`${palaceLabel} · ${hallLabel}`}</span>
        </div>

        <div className="harem-palace-view__header-actions">
          <button type="button" className="harem-palace-view__utility-button" onClick={onBack}>
            返回殿位
          </button>
        </div>
      </header>

      <div className="harem-palace-view__audience-meta">
        <article className="harem-palace-view__audience-card">
          <div className="harem-palace-view__audience-kv">
            <span>当前状态</span>
            <strong>{currentStateLabel}</strong>
          </div>
          <div className="harem-palace-view__audience-kv">
            <span>对你态度</span>
            <strong>{consort.stats.relationToPlayer}</strong>
          </div>
          <div className="harem-palace-view__audience-kv">
            <span>倾情</span>
            <strong>{consort.stats.affection}</strong>
          </div>
          <div className="harem-palace-view__audience-kv">
            <span>关系</span>
            <strong>{relationLabel}</strong>
          </div>
        </article>
      </div>

      <aside className="harem-palace-view__audience-actions" aria-label="宫内互动操作">
        <button type="button" onClick={() => void handleFixedAction('gift', '送礼')} disabled={busy}>
          送礼
        </button>
        <button type="button" onClick={() => void handleFixedAction('greet', '问好')} disabled={busy}>
          问好
        </button>
        <button type="button" onClick={() => void handleFixedAction('quarrel', '口角')} disabled={busy}>
          口角
        </button>
        <button type="button" onClick={() => void handleFixedAction('punish', '责罚')} disabled={busy || !canPunish}>
          责罚
        </button>
        <button type="button" onClick={() => void handleFixedAction('win-over', '拉拢')} disabled={busy}>
          拉拢
        </button>
        <button type="button" onClick={() => void handleFixedAction('smear', '抹黑')} disabled={busy}>
          抹黑
        </button>
        <button type="button" onClick={onBack} disabled={busy}>
          返回
        </button>
      </aside>

      {pickerMode === 'gift' ? (
        <section className="harem-palace-view__audience-picker" aria-label="送礼选物">
          <header>
            <strong>可赠礼物</strong>
            <button type="button" onClick={() => setPickerMode(null)}>
              收起
            </button>
          </header>
          <div className="harem-palace-view__audience-picker-list">
            {giftItems.length > 0 ? (
              giftItems.map((item) => (
                <button key={item.itemId} type="button" onClick={() => void applyGift(item)}>
                  <strong>{`${item.name} ×${item.quantity}`}</strong>
                  <span>{item.description}</span>
                </button>
              ))
            ) : (
              <p>当前背包里没有可送出的礼物。</p>
            )}
          </div>
        </section>
      ) : null}

      {pickerMode === 'smear' ? (
        <section className="harem-palace-view__audience-picker" aria-label="抹黑目标选择">
          <header>
            <strong>抹黑对象</strong>
            <button type="button" onClick={() => setPickerMode(null)}>
              收起
            </button>
          </header>
          <div className="harem-palace-view__audience-picker-list">
            {smearTargets.length > 0 ? (
              smearTargets.map((item) => (
                <button key={item.id} type="button" onClick={() => void applySmear(item)}>
                  <strong>{`${getConcubineDisplayRankText(item)} ${item.name}`}</strong>
                  <span>{item.residence}</span>
                </button>
              ))
            ) : (
              <p>当前没有可被你牵进话头的其他妃嫔。</p>
            )}
          </div>
        </section>
      ) : null}

      <GlobalDialogueStage
        sceneLabel={`${displayRank} ${consort.name} 宫内对话场景`}
        portraitLabel={`${consort.name} 立绘`}
        portrait={<img src={portraitSrc} alt={consort.name} className="global-dialogue-stage__portrait-media global-dialogue-stage__portrait-media--consort" />}
        ariaLabel="妃嫔宫内对话框"
        className="global-dialogue-stage--consort global-dialogue-stage--with-side-panel"
        dialogueClassName="palace-dialogue-box--consort-audience"
        characterIdentity={dialogueTurn?.speakerIdentity ?? displayRank}
        characterName={dialogueTurn?.speakerName ?? consort.name}
        content={dialogueTurn?.text ?? '她仍立在灯下，像是在等你先开口。'}
        nextActionLabel={pickerMode === null && dialogueOptions.length === 0 ? dialogueTurn?.nextActionLabel : undefined}
        onNextAction={
          pickerMode === null && dialogueOptions.length === 0
            ? () => {
                void handleNextLine();
              }
            : undefined
        }
        options={dialogueOptions as ConsortDialogueOption[]}
        onSelectOption={(optionId) => {
          void handleOptionSelect(optionId);
        }}
        busy={busy}
      />
    </section>
  );
}
