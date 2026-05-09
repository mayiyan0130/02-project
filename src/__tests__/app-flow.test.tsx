/* @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { CONSORT_DIALOGUE_TIMEOUT_MS } from '../ai/consortDialogueAgent';
import { GlobalDialogue } from '../components/dialogue/PalaceDialogueBox';
import { getFavorTierByValue, STAMINA_INITIAL_PER_XUN } from '../config/constants';
import { buildInitialBondProfile } from '../game/data/bondPresets';
import { buildInitialConcubineRoster } from '../game/data/concubineRoster';
import { buildMusicScoreItem, cloneInitialInventory } from '../game/data/inventoryPresets';
import { useGameFlowStore } from '../game/store/gameFlowStore';

const resetFlowStore = () => {
  const defaultFavorTier = getFavorTierByValue(50);
  useGameFlowStore.setState((state) => ({
    ...state,
    currentView: 'start',
    scene: 'menu',
    activeChamberPanel: 'main',
    activeMapLocation: undefined,
    activeAffairsSource: '宫斗事务',
    routeId: 'lanyinxuguo',
    state: {
      ...state.state,
      routeId: 'lanyinxuguo',
      openingTendency: undefined,
      stamina: STAMINA_INITIAL_PER_XUN,
      flags: {},
    },
    hiddenStats: {
      silver: 1000,
      prestige: 2500,
      stress: 30,
      favor: 50,
      trueHeart: 35,
      favorLabel: defaultFavorTier.label,
      favorColor: defaultFavorTier.color,
      initialRank: undefined,
    },
    selectedRoute: undefined,
    briefing: '',
    dialogue: undefined,
    mapEventText: '',
    save: undefined,
    settlementReports: [],
    latestSettlementReportId: undefined,
    lastSeenSettlementReportId: undefined,
    bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
    concubineRouteId: 'lanyinxuguo',
    concubines: buildInitialConcubineRoster('lanyinxuguo'),
    customConsorts: [],
    inventory: cloneInitialInventory(),
    merchantLedger: {},
    consortInteractionMap: {},
    kitchenProgress: {
      strollCount: 0,
      buZiyouUnlocked: false,
      buZiyouMet: false,
      buZiyouFavor: 0,
      buZiyouAffinity: 0,
    },
    medicalProgress: {
      strollCount: 0,
      consultationCount: 0,
      jianNingMet: false,
      jianNingFavor: 0,
      jianNingAffinity: 0,
    },
    musicHallProgress: {
      listenCount: 0,
      strollCount: 0,
      signUpCount: 0,
      lianQiaoFirstMet: false,
      lianQiaoMet: false,
      lianQiaoFavor: 0,
      lianQiaoAffection: 0,
    },
    templeProgress: {
      worshipCount: 0,
      prayerCount: 0,
      strollCount: 0,
      dangYiFavor: 0,
      dangYiAffinity: 0,
    },
    time: {
      year: 1,
      month: 1,
      xun: 1,
      slotIndex: 0,
      slot: '清晨',
      slotProgress: 0,
    },
  }));
};

const clickMapGuideReturnToChamber = async () => {
  const guideDialog = screen.queryByLabelText('地图引导对话框');
  if (guideDialog) {
    const nextButton = guideDialog.querySelector('.palace-dialogue-box__next');
    expect(nextButton).toBeInTheDocument();
    fireEvent.click(nextButton as Element);
    return;
  }

  const sidebar = await screen.findByLabelText('寝殿左侧功能栏');
  fireEvent.click(within(sidebar).getByRole('button', { name: '回宫' }));
};

describe('App 主流程切换', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    localStorage.clear();
    resetFlowStore();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('可从开始页进入路线选择页', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '开始新游戏' }));

    expect(await screen.findByText('通关要求')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '确定' })).toBeInTheDocument();
  });

  it('对话正文逐字显示时点击文本框会立即补全', () => {
    const fullText = '她将手中茶盏轻轻搁下，抬眼望向你，像是终于肯把这一句话说完。';

    const { container } = render(
      <GlobalDialogue
        characterIdentity="贵妃"
        characterName="姚铃儿"
        content={fullText}
        nextActionLabel="下一句"
        onNextAction={vi.fn()}
        typewriter={true}
      />,
    );

    expect(screen.queryByText(fullText)).not.toBeInTheDocument();

    const contentLayer = container.querySelector('.palace-dialogue-box__content');
    expect(contentLayer).toBeInTheDocument();

    fireEvent.click(contentLayer as Element);

    expect(screen.getByText(fullText)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一句' })).toBeInTheDocument();
  });

  it('可从路线选择页进入属性页，再进入开场引导', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '开始新游戏' }));
    fireEvent.click(await screen.findByRole('button', { name: '确定' }));

    expect(await screen.findByText(/剩余点数/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '确认进入剧情' }));

    expect(await screen.findByText('中宫掌事宫女 · 娇娇')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一句' })).toBeInTheDocument();
  });

  it('不同开局角色会拿到不同的开场人设回应', async () => {
    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'opening-dialogue',
      scene: 'briefing',
      routeId: 'chenyuansucuo',
      state: {
        ...state.state,
        routeId: 'chenyuansucuo',
        name: '乌兰托娅',
        family: '和亲公主',
        residenceName: '玉清宫',
        favor: 50,
        stress: 40,
      },
      hiddenStats: {
        silver: 1000,
        prestige: 1200,
        stress: 40,
        favor: 50,
        trueHeart: 10,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '和亲入宫',
      },
      selectedRoute: {
        id: 'chenyuansucuo',
        label: '尘缘夙错',
        labelArt: '/assets/routes/labels/chenyuansucuo-vertical.png',
        intro: '',
        defaultName: '乌兰托娅',
        familyDisplay: '和亲公主',
        residenceDisplay: '玉清宫',
        biography: '',
        clearanceRequirement: '',
        difficulty: '中等',
        portrait: '/assets/routes/portraits/chenyuansucuo.png',
        fontMask: '/assets/routes/fonts/chenyuansucuo-mask.png',
        bannerHeight: 84,
        bannerOffsetTop: 11,
        familyOptions: ['和亲公主'],
        statsLocked: true,
        baseState: {
          name: '乌兰托娅',
          family: '和亲公主',
          residenceName: '玉清宫',
        },
        hiddenStats: {
          silver: 1000,
          prestige: 1200,
          stress: 40,
          favor: 50,
          trueHeart: 10,
          favorLabel: defaultFavorTier.label,
          favorColor: defaultFavorTier.color,
          initialRank: '和亲入宫',
        },
      },
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 0,
        slot: '清晨',
        slotProgress: 0,
      },
    }));

    render(<App />);

    expect(await screen.findByText('陪嫁侍女 · 娇娇')).toBeInTheDocument();
    expect(screen.getByText(/和亲|故国|异邦/)).toBeInTheDocument();
  });

  it('可从开场引导进入地图，再进入寝殿', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '开始新游戏' }));
    fireEvent.click(await screen.findByRole('button', { name: '确定' }));
    fireEvent.click(await screen.findByRole('button', { name: '确认进入剧情' }));

    fireEvent.click(await screen.findByRole('button', { name: '下一句' }));
    fireEvent.click(await screen.findByRole('button', { name: '听明白了' }));
    const tendencyButton = (await screen.findByText('韬光养晦')).closest('button');
    expect(tendencyButton).not.toBeNull();
    fireEvent.click(tendencyButton!);

    expect(await screen.findByText('继续')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '继续' }));
    await clickMapGuideReturnToChamber();

    await waitFor(() => {
      expect(screen.getByText(/诵读经典/)).toBeInTheDocument();
      expect(screen.queryByText(/更换装扮/)).not.toBeInTheDocument();
    });
  });

  it('太医院遇到简宁时会进入对话场景', async () => {
    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'main',
      activeMapLocation: '太医院',
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        openingTendency: '韬光养晦',
        stamina: STAMINA_INITIAL_PER_XUN,
        flags: {
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      medicalProgress: {
        strollCount: 4,
        consultationCount: 0,
        jianNingMet: false,
        jianNingFavor: 0,
        jianNingAffinity: 0,
      },
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 1,
        slot: '上午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '闲逛' }));

    expect(await screen.findByLabelText('太医院对话框')).toBeInTheDocument();
    expect(await screen.findByText(/简宁正替一名宫人按脉/)).toBeInTheDocument();
  });

  it('开场本地 fallback 已显示时不会被后台 AI loading 锁住', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockReset();
    fetchMock.mockImplementation(() => new Promise<Response>(() => {}));

    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'opening-dialogue',
      scene: 'briefing',
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        family: '镇国公嫡女',
        residenceName: '椒房殿',
        openingTendency: undefined,
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      selectedRoute: undefined,
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 0,
        slot: '清晨',
        slotProgress: 0,
      },
    }));

    render(<App />);

    const nextButton = await screen.findByRole('button', { name: '下一句' });
    expect(nextButton).not.toBeDisabled();
    fireEvent.click(nextButton);

    const understoodButton = await screen.findByRole('button', { name: '听明白了' });
    expect(understoodButton).not.toBeDisabled();
    fireEvent.click(understoodButton);

    const tendencyButton = (await screen.findByText('韬光养晦')).closest('button');
    expect(tendencyButton).not.toBeNull();
    expect(tendencyButton).not.toBeDisabled();
  });

  it('宫门中的杜娘可购买与回收道具', async () => {
    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'map-main',
      scene: 'map',
      activeChamberPanel: 'main',
      activeMapLocation: undefined,
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        silver: 1000,
        favor: 50,
        flags: {
          ...state.state.flags,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
      inventory: cloneInitialInventory(),
      merchantLedger: {},
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 1,
        slot: '上午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '宫门' }));
    fireEvent.click(await screen.findByRole('button', { name: '进入此处' }));
    fireEvent.click(await screen.findByRole('button', { name: '杜娘' }));

    expect(await screen.findByLabelText('杜娘 宫门对话')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '杜娘' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '购买' }));
    expect(await screen.findByRole('dialog', { name: '杜娘购买弹窗' })).toBeInTheDocument();
    const purchaseButtons = await screen.findAllByRole('button', { name: /^购买 / });
    expect(purchaseButtons.length).toBeGreaterThanOrEqual(8);
    expect(purchaseButtons.length).toBeLessThanOrEqual(10);

    fireEvent.click(screen.getByRole('button', { name: '购买 缠枝香囊' }));

    await waitFor(() => {
      expect(useGameFlowStore.getState().state.silver).toBe(930);
      expect(useGameFlowStore.getState().inventory.find((item) => item.itemId === 'embroidered-sachet')?.quantity).toBe(3);
      expect(screen.getByText('当前银两：930')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '售卖' }));
    expect(await screen.findByRole('dialog', { name: '杜娘售卖弹窗' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '售卖 缠枝香囊' }));

    await waitFor(() => {
      expect(useGameFlowStore.getState().state.silver).toBe(986);
      expect(useGameFlowStore.getState().inventory.find((item) => item.itemId === 'embroidered-sachet')?.quantity).toBe(2);
      expect(screen.getByText('当前银两：986')).toBeInTheDocument();
    });
  });

  it('杜娘闲谈先显示本地回应，不被后台 AI 请求锁住', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockReset();
    fetchMock.mockImplementation(() => new Promise<Response>(() => {}));

    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'map-main',
      scene: 'map',
      activeChamberPanel: 'main',
      activeMapLocation: undefined,
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        silver: 1000,
        favor: 50,
        flags: {
          ...state.state.flags,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
      inventory: cloneInitialInventory(),
      merchantLedger: {},
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 1,
        slot: '上午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '宫门' }));
    fireEvent.click(await screen.findByRole('button', { name: '进入此处' }));
    fireEvent.click(await screen.findByRole('button', { name: '杜娘' }));

    const smallTalkButton = await screen.findByRole('button', { name: '闲谈' });
    fireEvent.click(smallTalkButton);

    expect(await screen.findByText(/买卖归买卖，闲话归闲话/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '闲谈' })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: '闲谈' }));
    expect(await screen.findByText(/闲谈不入账|热闹/)).toBeInTheDocument();
  });

  it('妙音堂会显示基础按钮，并在结识连翘后开放曲谱报名', async () => {
    const defaultFavorTier = getFavorTierByValue(50);
    const score = buildMusicScoreItem('score-phoenix-return');
    expect(score).not.toBeNull();

    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'main',
      activeMapLocation: '妙音堂',
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        favor: 55,
        flags: {
          ...state.state.flags,
          isLianQiaoMet: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 55,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      inventory: [...cloneInitialInventory(), score!],
      musicHallProgress: {
        listenCount: 6,
        strollCount: 0,
        signUpCount: 0,
        lianQiaoFirstMet: true,
        lianQiaoMet: true,
        lianQiaoFavor: 2,
        lianQiaoAffection: 2,
      },
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 1,
        slot: '上午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    expect(await screen.findByRole('button', { name: '报名' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '听曲' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '闲逛' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '连翘' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '报名' }));
    expect(await screen.findByRole('dialog', { name: '妙音堂曲谱报名' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /凤归云阙谱/ }));

    await waitFor(() => {
      expect(useGameFlowStore.getState().musicHallProgress.signUpCount).toBe(1);
      expect(useGameFlowStore.getState().inventory.some((item) => item.itemId === 'score-phoenix-return')).toBe(false);
    });
  });

  it('位分低于容华时不能进入华清池', async () => {
    const defaultFavorTier = getFavorTierByValue(20);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'map-main',
      scene: 'map',
      activeChamberPanel: 'main',
      activeMapLocation: undefined,
      routeId: 'fushengrumeng',
      state: {
        ...state.state,
        routeId: 'fushengrumeng',
        name: '沈容儿',
        residenceName: '储秀宫',
        prestige: 300,
        favor: 20,
        flags: {
          ...state.state.flags,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 300,
        prestige: 300,
        stress: 0,
        favor: 20,
        trueHeart: 20,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '才人',
      },
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '华清池' }));
    fireEvent.click(await screen.findByRole('button', { name: '进入此处' }));

    expect(await screen.findByText('贴身宫女 · 娇娇')).toBeInTheDocument();
    expect(screen.getByText('小主，华清池乃是容华及以上位分方可享用之地，咱们还是先请回吧。')).toBeInTheDocument();
    expect(useGameFlowStore.getState().activeMapLocation).toBeUndefined();
  });

  it('深夜时华清池双人沐浴邀请列表会出现连翘', async () => {
    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => {
      const nextConcubines = state.concubines.map((consort, index) =>
        index === 0
          ? {
              ...consort,
              stats: {
                ...consort.stats,
                affection: 50,
                relationToPlayer: 45,
              },
            }
          : consort,
      );

      return {
        ...state,
        currentView: 'bedchamber',
        scene: 'activity',
        activeChamberPanel: 'main',
        activeMapLocation: '华清池',
        routeId: 'lanyinxuguo',
        state: {
          ...state.state,
          routeId: 'lanyinxuguo',
          name: '谢令仪',
          residenceName: '椒房殿',
          prestige: 900,
          favor: 50,
          flags: {
            ...state.state.flags,
            isLianQiaoMet: true,
          },
        },
        hiddenStats: {
          silver: 1000,
          prestige: 900,
          stress: 30,
          favor: 50,
          trueHeart: 35,
          favorLabel: defaultFavorTier.label,
          favorColor: defaultFavorTier.color,
          initialRank: '婕好',
        },
        concubines: nextConcubines,
        musicHallProgress: {
          listenCount: 6,
          strollCount: 0,
          signUpCount: 0,
          lianQiaoFirstMet: true,
          lianQiaoMet: true,
          lianQiaoFavor: 5,
          lianQiaoAffection: 40,
        },
        time: {
          year: 1,
          month: 2,
          xun: 1,
          slotIndex: 6,
          slot: '深夜',
          slotProgress: 0,
        },
      };
    });

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '双人沐浴' }));

    expect(await screen.findByRole('dialog', { name: '华清池邀请列表' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /连翘/ })).toBeInTheDocument();
  });

  it('尘缘夙错线的宫门会显示杜娘与阿翎入口', async () => {
    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'map-main',
      scene: 'map',
      activeChamberPanel: 'main',
      activeMapLocation: undefined,
      routeId: 'chenyuansucuo',
      state: {
        ...state.state,
        routeId: 'chenyuansucuo',
        name: '乌雅明珠',
        residenceName: '玉清宫',
        silver: 1000,
        favor: 50,
        flags: {
          ...state.state.flags,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '公主',
      },
      bondProfile: buildInitialBondProfile('chenyuansucuo', '1-1-1'),
      concubineRouteId: 'chenyuansucuo',
      concubines: buildInitialConcubineRoster('chenyuansucuo'),
      inventory: cloneInitialInventory(),
      merchantLedger: {},
      time: {
        year: 1,
        month: 3,
        xun: 1,
        slotIndex: 1,
        slot: '上午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '宫门' }));
    fireEvent.click(await screen.findByRole('button', { name: '进入此处' }));

    expect(await screen.findByRole('button', { name: '杜娘' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '阿翎' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '阿翎' }));

    expect(await screen.findByLabelText('阿翎 宫门对话')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '叙旧' })).toBeInTheDocument();
  });

  it('地图热点可直达现有朝堂事务面板', async () => {
    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'map-main',
      scene: 'map',
      activeChamberPanel: 'main',
      activeMapLocation: undefined,
      activeAffairsSource: '宫斗事务',
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        favor: 50,
        flags: {
          ...state.state.flags,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
      inventory: cloneInitialInventory(),
      merchantLedger: {},
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 1,
        slot: '上午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '御书房' }));
    fireEvent.click(screen.getByRole('button', { name: '朝堂事务' }));

    expect(await screen.findByText('朝堂事务')).toBeInTheDocument();
    expect(useGameFlowStore.getState().activeAffairsSource).toBe('朝堂事务');
  });

  it('后宫布局会把玩家当前住所落到对应主殿', async () => {
    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'harem',
      activeMapLocation: undefined,
      routeId: 'chenyuansucuo',
      state: {
        ...state.state,
        routeId: 'chenyuansucuo',
        name: '乌兰托娅',
        residenceName: '玉清宫',
        openingTendency: '韬光养晦',
        stamina: STAMINA_INITIAL_PER_XUN,
        favor: 50,
        flags: {
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 1200,
        stress: 30,
        favor: 50,
        trueHeart: 10,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '和亲入宫',
      },
      bondProfile: buildInitialBondProfile('chenyuansucuo', '1-1-1'),
      concubineRouteId: 'chenyuansucuo',
      concubines: buildInitialConcubineRoster('chenyuansucuo'),
      inventory: cloneInitialInventory(),
      consortInteractionMap: {},
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 1,
        slot: '上午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '玉清宫' }));

    expect(await screen.findByRole('button', { name: /主殿[\s\S]*和亲入宫 乌兰托娅/ })).toBeInTheDocument();
  });

  it('点击地图上的当前宫殿会直接等同回宫，不再弹进入确认', async () => {
    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'map-main',
      scene: 'map',
      activeChamberPanel: 'main',
      activeMapLocation: undefined,
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        favor: 50,
        flags: {
          ...state.state.flags,
          mapGuideFinished: true,
          bedchamberIntroShown: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
      inventory: cloneInitialInventory(),
      merchantLedger: {},
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 1,
        slot: '上午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '椒房殿' }));

    expect(await screen.findByText('诵读经典')).toBeInTheDocument();
    expect(screen.getByText('泼墨作画')).toBeInTheDocument();
    expect(useGameFlowStore.getState().activeMapLocation).toBeUndefined();
    expect(screen.queryByRole('button', { name: '进入此处' })).not.toBeInTheDocument();
  });

  it('地图中的寝殿热点会随玩家当前住处动态变化', async () => {
    const defaultFavorTier = getFavorTierByValue(18);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'map-main',
      scene: 'map',
      activeChamberPanel: 'main',
      activeMapLocation: undefined,
      routeId: 'fushengrumeng',
      state: {
        ...state.state,
        routeId: 'fushengrumeng',
        name: '宁小满',
        residenceName: '储秀宫',
        favor: 18,
        flags: {
          ...state.state.flags,
          mapGuideFinished: true,
          bedchamberIntroShown: true,
        },
      },
      hiddenStats: {
        silver: 520,
        prestige: 300,
        stress: 8,
        favor: 18,
        trueHeart: 12,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '才人',
      },
      bondProfile: buildInitialBondProfile('fushengrumeng', '1-1-1'),
      concubineRouteId: 'fushengrumeng',
      concubines: buildInitialConcubineRoster('fushengrumeng'),
      inventory: cloneInitialInventory(),
      merchantLedger: {},
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 1,
        slot: '上午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '储秀宫' }));

    expect(await screen.findByText('诵读经典')).toBeInTheDocument();
    expect(useGameFlowStore.getState().state.residenceName).toBe('储秀宫');
    expect(screen.queryByRole('button', { name: '椒房殿' })).not.toBeInTheDocument();
  });

  it('外景场景左侧会保留外出并额外显示回宫按钮', async () => {
    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'main',
      activeMapLocation: '御膳房',
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        favor: 50,
        flags: {
          ...state.state.flags,
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
      inventory: cloneInitialInventory(),
      merchantLedger: {},
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 1,
        slot: '上午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    expect(await screen.findByRole('button', { name: '外出' })).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: '回宫' }));

    expect(await screen.findByText('诵读经典')).toBeInTheDocument();
    expect(useGameFlowStore.getState().activeMapLocation).toBeUndefined();
  });

  it('御膳房可购买美食并在第四次闲逛强制触发布自游', async () => {
    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'main',
      activeMapLocation: '御膳房',
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        silver: 1000,
        favor: 50,
        flags: {
          ...state.state.flags,
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
      inventory: cloneInitialInventory(),
      merchantLedger: {},
      kitchenProgress: {
        strollCount: 3,
        buZiyouUnlocked: false,
        buZiyouMet: false,
        buZiyouFavor: 0,
        buZiyouAffinity: 0,
      },
      templeProgress: {
        worshipCount: 0,
        prayerCount: 0,
        strollCount: 0,
        dangYiFavor: 0,
        dangYiAffinity: 0,
      },
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 3,
        slot: '下午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    expect(await screen.findByRole('button', { name: '闲逛' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '购买美食' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '购买美食' }));
    expect(await screen.findByRole('dialog', { name: '御膳房购买美食弹窗' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '购买 桂花酥酪' }));

    await waitFor(() => {
      expect(useGameFlowStore.getState().state.silver).toBe(955);
      expect(screen.getByText('当前银两：955')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '收起' }));
    fireEvent.click(screen.getByRole('button', { name: '闲逛' }));

    expect(await screen.findByLabelText('御膳房对话框')).toBeInTheDocument();
    expect(screen.getByText('御厨 · 布自游')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^借食单试探他/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^放软语气示好/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^故意留半句玩笑/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '返回御膳房' }));

    expect(await screen.findByRole('button', { name: '布自游' })).toBeInTheDocument();
    expect(useGameFlowStore.getState().kitchenProgress.buZiyouUnlocked).toBe(true);
    expect(useGameFlowStore.getState().kitchenProgress.buZiyouMet).toBe(true);
  });

  it('NPC 初遇对白 AI 长时间无响应时会回退到本地选项', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockReset();
    fetchMock.mockImplementation((input, init) => {
      const requestUrl = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

      if (requestUrl.endsWith('/api/v1/ai/consort-dialogue')) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
      }

      throw new Error('offline');
    });

    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'main',
      activeMapLocation: '御膳房',
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        silver: 1000,
        favor: 50,
        flags: {
          ...state.state.flags,
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
      inventory: cloneInitialInventory(),
      merchantLedger: {},
      kitchenProgress: {
        strollCount: 3,
        buZiyouUnlocked: false,
        buZiyouMet: false,
        buZiyouFavor: 0,
        buZiyouAffinity: 0,
      },
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 3,
        slot: '下午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '闲逛' }));

    expect(screen.getByText('炊火声里，对方像是在等你先开口。')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: '借食单试探他' })).toBeInTheDocument();
      },
      { timeout: CONSORT_DIALOGUE_TIMEOUT_MS + 1000 },
    );
    expect(screen.getByRole('button', { name: '放软语气示好' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '故意留半句玩笑' })).toBeInTheDocument();
  });

  it('御膳房在 AI 返回 line 模式时显示 下一句 并继续推进', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    let kitchenTurnCount = 0;

    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input) => {
      const requestUrl = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

      if (requestUrl.endsWith('/api/v1/ai/consort-dialogue')) {
        kitchenTurnCount += 1;

        return {
          ok: true,
          json: async () =>
            kitchenTurnCount === 1
              ? {
                  mode: 'line',
                  phase: 'continue',
                  speakerIdentity: '御厨',
                  speakerName: '布自游',
                  text: '布自游把汤勺轻轻搁回灶边，抬眼时笑意还压在唇角：“娘娘既来了御膳房，总不至于只看一眼火候。若还想往下问，我便听着。”',
                  nextActionLabel: '下一句',
                  sceneHint: '他没有立刻表态，还在等你把这句继续说完。',
                  options: [],
                }
              : {
                  mode: 'branch',
                  phase: 'continue',
                  speakerIdentity: '御厨',
                  speakerName: '布自游',
                  text: '他这才把视线真正落到你身上，声音却仍压得不紧不慢：“行，那娘娘就说吧。您想试我的心，还是想借这灶火先暖一暖场面？”',
                  nextActionLabel: '收起',
                  sceneHint: '布自游已经把话口留出来了。',
                  options: [
                    { id: 'probe', label: '借食单试探他', effectHint: '顺着闲话探一探他真正站哪边。', fallbackToneTag: 'neutral' },
                    { id: 'warm', label: '放软语气示好', effectHint: '更容易稳稳攒一点好感。', fallbackToneTag: 'friendly' },
                    { id: 'tease', label: '故意留半句玩笑', effectHint: '若他愿接，最容易牵出暧昧余地。', fallbackToneTag: 'flirt' },
                  ],
                },
        } as Response;
      }

      throw new Error('offline');
    });

    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'main',
      activeMapLocation: '御膳房',
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        silver: 1000,
        favor: 50,
        flags: {
          ...state.state.flags,
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
      inventory: cloneInitialInventory(),
      merchantLedger: {},
      kitchenProgress: {
        strollCount: 3,
        buZiyouUnlocked: false,
        buZiyouMet: false,
        buZiyouFavor: 0,
        buZiyouAffinity: 0,
      },
      templeProgress: {
        worshipCount: 0,
        prayerCount: 0,
        strollCount: 0,
        dangYiFavor: 0,
        dangYiAffinity: 0,
      },
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 3,
        slot: '下午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '闲逛' }));

    expect(await screen.findByRole('button', { name: '下一句' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^借食单试探他/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '下一句' }));

    expect(await screen.findByRole('button', { name: /^借食单试探他/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^放软语气示好/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^故意留半句玩笑/ })).toBeInTheDocument();
    expect(kitchenTurnCount).toBe(2);
  });

  it('宝华殿礼佛三次后结识当一，祈福会增加福德', async () => {
    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'main',
      activeMapLocation: '宝华殿',
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        silver: 1000,
        favor: 50,
        stats: {
          ...state.state.stats,
          fortune: 3,
        },
        flags: {
          ...state.state.flags,
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
      inventory: cloneInitialInventory(),
      merchantLedger: {},
      templeProgress: {
        worshipCount: 0,
        prayerCount: 0,
        strollCount: 0,
        dangYiFavor: 0,
        dangYiAffinity: 0,
      },
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 0,
        slot: '清晨',
        slotProgress: 0,
      },
    }));

    render(<App />);

    expect(await screen.findByRole('button', { name: '礼佛' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '祈福' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '闲逛' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '当一' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '祈福' }));

    await waitFor(() => {
      expect(useGameFlowStore.getState().state.stats.fortune).toBe(4);
      expect(useGameFlowStore.getState().templeProgress.prayerCount).toBe(1);
    });

    fireEvent.click(screen.getByRole('button', { name: '礼佛' }));
    fireEvent.click(await screen.findByRole('button', { name: '礼佛' }));
    fireEvent.click(await screen.findByRole('button', { name: '礼佛' }));

    expect(await screen.findByLabelText('宝华殿对话框')).toBeInTheDocument();
    expect(screen.getByText('佛殿执事 · 当一')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^先按礼回话/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^先按礼回话/ }));
    expect(await screen.findByRole('button', { name: '收起' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '收起' }));

    expect(await screen.findByRole('button', { name: '当一' })).toBeInTheDocument();
    expect(useGameFlowStore.getState().state.flags.isDangYiMet).toBe(true);
    expect(useGameFlowStore.getState().templeProgress.worshipCount).toBe(3);
  });

  it('寝殿情缘面板默认只显示主线对象的只读心声', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '开始新游戏' }));
    fireEvent.click(await screen.findByRole('button', { name: '确定' }));
    fireEvent.click(await screen.findByRole('button', { name: '确认进入剧情' }));

    fireEvent.click(await screen.findByRole('button', { name: '下一句' }));
    fireEvent.click(await screen.findByRole('button', { name: '听明白了' }));
    const tendencyButton = (await screen.findByText('韬光养晦')).closest('button');
    expect(tendencyButton).not.toBeNull();
    fireEvent.click(tendencyButton!);

    fireEvent.click(await screen.findByRole('button', { name: '继续' }));
    await clickMapGuideReturnToChamber();
    await waitFor(() => {
      expect(screen.getByText(/诵读经典/)).toBeInTheDocument();
      expect(screen.queryByText(/更换装扮/)).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: '情缘' }));

    expect(await screen.findByText(/容安表面上仍守着皇帝该有的分寸/)).toBeInTheDocument();
    expect(screen.queryByText('含笑试探')).not.toBeInTheDocument();
    expect(screen.queryByText(/最近判定/)).not.toBeInTheDocument();
    expect(screen.queryByText('江晚晚')).not.toBeInTheDocument();
    expect(screen.queryByText('姚铃儿')).not.toBeInTheDocument();
  });

  it('妃嫔倾情达到 60 后才会出现在情缘面板', async () => {
    const roster = buildInitialConcubineRoster('lanyinxuguo').map((consort) =>
      consort.name === '江晚晚'
        ? {
            ...consort,
            stats: {
              ...consort.stats,
              affection: 60,
            },
          }
        : consort,
    );
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'main',
      activeMapLocation: undefined,
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        openingTendency: '韬光养晦',
        flags: {
          ...state.state.flags,
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: roster,
    }));

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '情缘' }));

    fireEvent.click((await screen.findByText('江晚晚')).closest('button')!);

    await waitFor(() => {
      expect(screen.getByText(/江晚晚表面上仍守着淑妃该有的分寸/)).toBeInTheDocument();
    });
  });

  it('尘缘夙错线的情缘主对象只显示阿翎', async () => {
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'main',
      activeMapLocation: undefined,
      routeId: 'chenyuansucuo',
      state: {
        ...state.state,
        routeId: 'chenyuansucuo',
        openingTendency: '韬光养晦',
        flags: {
          ...state.state.flags,
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      bondProfile: buildInitialBondProfile('chenyuansucuo', '1-1-1'),
      concubineRouteId: 'chenyuansucuo',
      concubines: buildInitialConcubineRoster('chenyuansucuo'),
    }));

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '情缘' }));

    expect(await screen.findByText(/阿翎表面上仍守着故国旧识该有的分寸/)).toBeInTheDocument();
    expect(screen.queryByText('容安')).not.toBeInTheDocument();
  });

  it('特殊角色在对应触发旗标生效后会进入情缘面板', async () => {
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'main',
      activeMapLocation: undefined,
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        openingTendency: '韬光养晦',
        flags: {
          ...state.state.flags,
          bedchamberIntroShown: true,
          mapGuideFinished: true,
          'bondNpcUnlocked:buziyou': true,
        },
      },
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
    }));

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '情缘' }));

    fireEvent.click((await screen.findByText('布自游')).closest('button')!);

    await waitFor(() => {
      expect(screen.getByText(/布自游表面上仍守着御厨该有的分寸/)).toBeInTheDocument();
    });
  });

  it('宫斗事务选择下毒后只显示三味毒物', async () => {
    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'main',
      activeMapLocation: undefined,
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        openingTendency: '韬光养晦',
        stamina: STAMINA_INITIAL_PER_XUN,
        prestige: 2500,
        favor: 50,
        flags: {
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
    }));

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '宫斗事务' }));
    fireEvent.click(screen.getByRole('button', { name: '方式' }));
    fireEvent.click(screen.getByRole('button', { name: /下毒/ }));
    fireEvent.click(screen.getByRole('button', { name: '道具' }));

    expect(await screen.findByText('鹤顶红')).toBeInTheDocument();
    expect(screen.getByText('麝香')).toBeInTheDocument();
    expect(screen.getByText('陨颜丹')).toBeInTheDocument();
    expect(screen.queryByText('不使用')).not.toBeInTheDocument();
    expect(screen.queryByText('香囊')).not.toBeInTheDocument();
    expect(screen.queryByText('书信')).not.toBeInTheDocument();
    expect(screen.queryByText('补品')).not.toBeInTheDocument();
  });

  it('寝殿嫔妃面板可切换状态并展示对应名单', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '开始新游戏' }));
    fireEvent.click(await screen.findByRole('button', { name: '确定' }));
    fireEvent.click(await screen.findByRole('button', { name: '确认进入剧情' }));

    fireEvent.click(await screen.findByRole('button', { name: '下一句' }));
    fireEvent.click(await screen.findByRole('button', { name: '听明白了' }));
    const tendencyButton = (await screen.findByText('韬光养晦')).closest('button');
    expect(tendencyButton).not.toBeNull();
    fireEvent.click(tendencyButton!);

    fireEvent.click(await screen.findByRole('button', { name: '继续' }));
    await clickMapGuideReturnToChamber();

    await waitFor(() => {
      expect(screen.getByText(/诵读经典/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '嫔妃' }));

    expect(await screen.findByLabelText('嫔妃总览面板')).toBeInTheDocument();
    expect(screen.getAllByText(/姚铃儿/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('tab', { name: '冷宫' }));
    expect(await screen.findByRole('listitem', { name: '庶人 杜若蘅' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: '已逝' }));
    expect(await screen.findByRole('listitem', { name: '悼嫔 冯妙莲' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '返回' }));
    await waitFor(() => {
      expect(screen.queryByLabelText('嫔妃总览面板')).not.toBeInTheDocument();
    });
  });

  it('后宫宫内可进入妃嫔日常对话并展示固定操作', async () => {
    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'harem',
      activeMapLocation: undefined,
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        openingTendency: '韬光养晦',
        stamina: STAMINA_INITIAL_PER_XUN,
        prestige: 2500,
        favor: 50,
        flags: {
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      selectedRoute: undefined,
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
      inventory: cloneInitialInventory(),
      consortInteractionMap: {},
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 1,
        slot: '上午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '长春宫' }));
    fireEvent.click(await screen.findByRole('button', { name: /主殿[\s\S]*姚铃儿/ }));

    expect(await screen.findByLabelText('贵妃 姚铃儿 日常对话')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '送礼' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '问好' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '口角' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '责罚' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '拉拢' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '抹黑' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '返回' })).toBeInTheDocument();

    expect(await screen.findByText(/娘娘今日亲来/)).toBeInTheDocument();
    expect(screen.getByText('温声再问一句')).toBeInTheDocument();
    expect(screen.getByText('借话轻轻试探')).toBeInTheDocument();
    expect(screen.getByText('只把礼数做满')).toBeInTheDocument();
  });

  it('妃嫔对话 AI 长时间无响应时会退回本地角色对白', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockReset();
    fetchMock.mockImplementation((input, init) => {
      const requestUrl = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

      if (requestUrl.endsWith('/api/v1/ai/consort-dialogue')) {
        return new Promise<Response>((_, reject) => {
          const signal = init?.signal;
          if (signal instanceof AbortSignal) {
            signal.addEventListener(
              'abort',
              () => {
                reject(new DOMException('Aborted', 'AbortError'));
              },
              { once: true },
            );
          }
        });
      }

      throw new Error('offline');
    });

    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'harem',
      activeMapLocation: undefined,
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        openingTendency: '韬光养晦',
        stamina: STAMINA_INITIAL_PER_XUN,
        prestige: 2500,
        favor: 50,
        flags: {
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      selectedRoute: undefined,
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
      inventory: cloneInitialInventory(),
      consortInteractionMap: {},
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 1,
        slot: '上午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '长春宫' }));
    fireEvent.click(await screen.findByRole('button', { name: /主殿[\s\S]*姚铃儿/ }));

    const warmOption = await screen.findByRole(
      'button',
      { name: '温声再问一句' },
      { timeout: CONSORT_DIALOGUE_TIMEOUT_MS + 1000 },
    );

    expect(warmOption).toBeInTheDocument();
    expect(screen.getByText(/娘娘今日亲来/)).toBeInTheDocument();
    expect(screen.getByText('借话轻轻试探')).toBeInTheDocument();
    expect(screen.getByText('只把礼数做满')).toBeInTheDocument();
  });

  it('妃嫔对话点击先行告退会发送玩家发言并在 AI 回复后收束', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    const requestPayloads: Array<Record<string, unknown>> = [];
    let consortTurnCount = 0;

    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input, init) => {
      const requestUrl = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

      if (requestUrl.endsWith('/api/v1/ai/consort-dialogue')) {
        consortTurnCount += 1;
        if (typeof init?.body === 'string') {
          requestPayloads.push(JSON.parse(init.body) as Record<string, unknown>);
        }

        return {
          ok: true,
          json: async () =>
            consortTurnCount === 1
              ? {
                  mode: 'branch',
                  phase: 'continue',
                  speakerIdentity: '贵妃',
                  speakerName: '姚铃儿',
                  text: '姚铃儿将茶盏轻轻一转，笑意浅浅：“娘娘既来了，想来总有一句话要留给妾。”',
                  nextActionLabel: '收起',
                  sceneHint: '她等你表态。',
                  options: [{ id: 'warm', label: '温声再问一句', effectHint: '先把敌意压下半寸。', fallbackToneTag: 'friendly' }],
                }
              : {
                  mode: 'branch',
                  phase: 'continue',
                  speakerIdentity: '贵妃',
                  speakerName: '姚铃儿',
                  text: '姚铃儿听见“先行告退”，便将袖口压平，低身道：“娘娘既要回去，妾不敢多留。”',
                  nextActionLabel: '继续纠缠',
                  sceneHint: '她已经接住你的告退。',
                  options: [{ id: 'hold', label: '不该显示的追问', effectHint: '这条应被收束逻辑隐藏。', fallbackToneTag: 'neutral' }],
                },
        } as Response;
      }

      throw new Error('offline');
    });

    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'harem',
      activeMapLocation: undefined,
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        openingTendency: '韬光养晦',
        stamina: STAMINA_INITIAL_PER_XUN,
        prestige: 2500,
        favor: 50,
        flags: {
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      selectedRoute: undefined,
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
      inventory: cloneInitialInventory(),
      consortInteractionMap: {},
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 1,
        slot: '上午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '长春宫' }));
    fireEvent.click(await screen.findByRole('button', { name: /主殿[\s\S]*姚铃儿/ }));
    expect(await screen.findByRole('button', { name: '先行告退' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '先行告退' }));

    expect(await screen.findByText(/妾不敢多留/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '收起' })).toBeInTheDocument();
    expect(screen.queryByText('不该显示的追问')).not.toBeInTheDocument();
    expect(requestPayloads[1]).toEqual(
      expect.objectContaining({
        actionId: 'farewell',
        actionLabel: '先行告退',
        selectedOptionId: 'farewell',
        selectedOptionLabel: '先行告退',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: '收起' }));

    await waitFor(() => {
      expect(screen.queryByLabelText('贵妃 姚铃儿 日常对话')).not.toBeInTheDocument();
    });
  });

  it('妃嫔对话在 AI 返回 line 模式时显示 下一句 并继续推进', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    let consortTurnCount = 0;

    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input) => {
      const requestUrl = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

      if (requestUrl.endsWith('/api/v1/ai/consort-dialogue')) {
        consortTurnCount += 1;

        return {
          ok: true,
          json: async () =>
            consortTurnCount === 1
              ? {
                  mode: 'line',
                  phase: 'continue',
                  speakerIdentity: '贵妃',
                  speakerName: '姚铃儿',
                  text: '姚铃儿指尖压着茶盏边沿，眼风却先从你衣襟上一掠而过，慢慢笑道：“娘娘今日肯亲自进殿，想来不是为了看这两枝新换的海棠。妾听着，娘娘不妨再把话往下说。”',
                  nextActionLabel: '下一句',
                  sceneHint: '她还在试探你的来意。',
                  options: [],
                }
              : {
                  mode: 'branch',
                  phase: 'continue',
                  speakerIdentity: '贵妃',
                  speakerName: '姚铃儿',
                  text: '她话音落下时，眼尾那点笑意却并不真暖，反倒像是把门只开了半扇：“若娘娘真有心与我说句体己话，便看娘娘打算把这份好意放到什么分寸上。”',
                  nextActionLabel: '收起',
                  sceneHint: '她开始等你表态了。',
                  options: [
                    { id: 'warm', label: '缓声示好', effectHint: '先把敌意压下半寸。', fallbackToneTag: 'friendly' },
                    { id: 'probe', label: '顺势试探', effectHint: '借她的话摸清真实态度。', fallbackToneTag: 'neutral' },
                  ],
                },
        } as Response;
      }

      throw new Error('offline');
    });

    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'harem',
      activeMapLocation: undefined,
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        openingTendency: '韬光养晦',
        stamina: STAMINA_INITIAL_PER_XUN,
        prestige: 2500,
        favor: 50,
        flags: {
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      selectedRoute: undefined,
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
      inventory: cloneInitialInventory(),
      consortInteractionMap: {},
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 1,
        slot: '上午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '长春宫' }));
    fireEvent.click(await screen.findByRole('button', { name: /主殿[\s\S]*姚铃儿/ }));

    expect(await screen.findByRole('button', { name: '下一句' })).toBeInTheDocument();
    expect(screen.queryByText('缓声示好')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '下一句' }));

    expect(await screen.findByText('缓声示好')).toBeInTheDocument();
    expect(screen.getByText('顺势试探')).toBeInTheDocument();
    expect(consortTurnCount).toBe(2);
  });

  it('妃嫔对话选项点击后会走关系判定并进入下一轮对白', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    let consortTurnCount = 0;
    let judgeTurnCount = 0;
    const consortPayloads: Array<{ selectedOptionId?: string; selectedOptionLabel?: string }> = [];

    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input, init) => {
      const requestUrl = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

      if (requestUrl.endsWith('/api/v1/ai/relationship-judge')) {
        judgeTurnCount += 1;
        return {
          ok: true,
          json: async () => ({
            toneTag: 'friendly',
            favorDelta: 1,
            affectionDelta: 0,
            reason: '这句语气偏示好。',
            confidence: 0.8,
          }),
        } as Response;
      }

      if (requestUrl.endsWith('/api/v1/ai/consort-dialogue')) {
        consortTurnCount += 1;
        const rawBody =
          input instanceof Request ? await input.clone().text() : typeof init?.body === 'string' ? init.body : '';

        if (rawBody) {
          const parsedBody = JSON.parse(rawBody) as { selectedOptionId?: string; selectedOptionLabel?: string };
          consortPayloads.push({
            selectedOptionId: parsedBody.selectedOptionId,
            selectedOptionLabel: parsedBody.selectedOptionLabel,
          });
        }

        return {
          ok: true,
          json: async () =>
            consortTurnCount === 1
              ? {
                  mode: 'branch',
                  phase: 'continue',
                  speakerIdentity: '贵妃',
                  speakerName: '姚铃儿',
                  text: '姚铃儿将茶盏轻轻一转，笑意浅浅：“娘娘既来了，想来总有一句话要留给妾。”',
                  nextActionLabel: '收起',
                  sceneHint: '她等你表态。',
                  options: [
                    { id: 'warm', label: '缓声示好', effectHint: '先把敌意压下半寸。', fallbackToneTag: 'friendly' },
                    { id: 'probe', label: '顺势试探', effectHint: '借她的话摸清真实态度。', fallbackToneTag: 'neutral' },
                  ],
                }
              : {
                  mode: 'line',
                  phase: 'finish',
                  speakerIdentity: '贵妃',
                  speakerName: '姚铃儿',
                  text: '姚铃儿听完这句，眼底那点锋芒终于收了些：“娘娘肯把话说到这个分寸，妾自然也会记得。”',
                  nextActionLabel: '收起',
                  sceneHint: '这一轮回应已经落定。',
                  options: [],
                },
        } as Response;
      }

      throw new Error('offline');
    });

    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'harem',
      activeMapLocation: undefined,
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        openingTendency: '韬光养晦',
        stamina: STAMINA_INITIAL_PER_XUN,
        prestige: 2500,
        favor: 50,
        flags: {
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      selectedRoute: undefined,
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
      inventory: cloneInitialInventory(),
      consortInteractionMap: {},
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 1,
        slot: '上午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '长春宫' }));
    fireEvent.click(await screen.findByRole('button', { name: /主殿[\s\S]*姚铃儿/ }));

    const optionGroup = await screen.findByRole('group', { name: '对话分支选项' });
    fireEvent.click(await within(optionGroup).findByRole('button', { name: /缓声示好/ }));

    expect(await screen.findByText(/妾自然也会记得/)).toBeInTheDocument();
    expect(judgeTurnCount).toBe(1);
    expect(consortTurnCount).toBe(2);
    expect(consortPayloads[1]).toEqual({
      selectedOptionId: 'warm',
      selectedOptionLabel: '缓声示好',
    });
  });

  it('御膳房选项点击后会保留上一句，直到真实回应或 fallback 返回', async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    let consortTurnCount = 0;

    fetchMock.mockReset();
    fetchMock.mockImplementation((input, init) => {
      const requestUrl = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

      if (requestUrl.endsWith('/api/v1/ai/relationship-judge')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            toneTag: 'friendly',
            favorDelta: 1,
            affectionDelta: 0,
            reason: '这句语气偏示好。',
            confidence: 0.8,
          }),
        } as Response);
      }

      if (requestUrl.endsWith('/api/v1/ai/consort-dialogue')) {
        consortTurnCount += 1;

        if (consortTurnCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              mode: 'branch',
              phase: 'continue',
              speakerIdentity: '布掌勺',
              speakerName: '布自游',
              text: '布自游拎着食盒从灶后转出来，低声笑道：“娘娘既肯走到这里，总该给我留一句能记住的话。”',
              nextActionLabel: '收起',
              sceneHint: '他等你表态。',
              options: [
                { id: 'warm', label: '放软语气示好', effectHint: '先把敌意压下半寸。', fallbackToneTag: 'friendly' },
                { id: 'probe', label: '借食单试探他', effectHint: '借他的话摸清真实态度。', fallbackToneTag: 'neutral' },
              ],
            }),
          } as Response);
        }

        return new Promise<Response>((_, reject) => {
          const signal = init?.signal;
          if (signal instanceof AbortSignal) {
            signal.addEventListener(
              'abort',
              () => {
                reject(new DOMException('Aborted', 'AbortError'));
              },
              { once: true },
            );
          }
        });
      }

      throw new Error('offline');
    });

    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'main',
      activeMapLocation: '御膳房',
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        name: '谢令仪',
        residenceName: '椒房殿',
        openingTendency: '韬光养晦',
        stamina: STAMINA_INITIAL_PER_XUN,
        prestige: 2500,
        favor: 50,
        flags: {
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        silver: 1000,
        prestige: 2500,
        stress: 30,
        favor: 50,
        trueHeart: 35,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
        initialRank: '皇后',
      },
      selectedRoute: undefined,
      bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
      concubineRouteId: 'lanyinxuguo',
      concubines: buildInitialConcubineRoster('lanyinxuguo'),
      inventory: cloneInitialInventory(),
      consortInteractionMap: {},
      kitchenProgress: {
        strollCount: 3,
        buZiyouUnlocked: false,
        buZiyouMet: false,
        buZiyouFavor: 0,
        buZiyouAffinity: 0,
      },
      time: {
        year: 1,
        month: 1,
        xun: 1,
        slotIndex: 1,
        slot: '上午',
        slotProgress: 0,
      },
    }));

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '闲逛' }));
    const optionGroup = await screen.findByRole('group', { name: '对话分支选项' });
    fireEvent.click(await within(optionGroup).findByRole('button', { name: /放软语气示好/ }));

    expect(screen.getByText(/娘娘既肯走到这里，总该给我留一句能记住的话/)).toBeInTheDocument();
    expect(await screen.findByText(/御膳房里不宜久留，这一轮先收着/)).toBeInTheDocument();
  });

  it('特殊角色不会进入妃嫔名单', () => {
    const roster = buildInitialConcubineRoster('lanyinxuguo', [
      {
        id: 'custom-taohou',
        routeScope: 'all',
        portraitId: '太后',
        name: '太后',
        rankLabel: '太后',
        status: 'live',
        residence: '慈宁宫',
        stateLabel: '寻常',
        age: 52,
        familyBackground: '皇家',
        personality: '威严沉静',
        summary: '特殊角色，不应进入妃嫔总览名单。',
        source: 'custom',
        stats: {
          prestige: 999,
          favor: 0,
          familyInfluence: 100,
          health: 100,
          appearance: 100,
          relationToPlayer: 0,
          childrenCount: 0,
          ambition: 0,
          stress: 0,
          intrigue: 100,
          temperament: 100,
          affection: 0,
          fortune: 100,
        },
        allies: [],
        rivals: [],
      },
    ]);
    const names = roster.map((consort) => consort.name);

    expect(names).not.toContain('连翘');
    expect(names).not.toContain('杜娘');
    expect(names).not.toContain('娇娇');
    expect(names.some((name) => name.includes('太后'))).toBe(false);
  });

  it('结束本旬后会进入下一旬清晨并弹出娇娇通报，纪事页同步留档', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '开始新游戏' }));
    fireEvent.click(await screen.findByRole('button', { name: '确定' }));
    fireEvent.click(await screen.findByRole('button', { name: '确认进入剧情' }));

    fireEvent.click(await screen.findByRole('button', { name: '下一句' }));
    fireEvent.click(await screen.findByRole('button', { name: '听明白了' }));
    const tendencyButton = (await screen.findByText('韬光养晦')).closest('button');
    expect(tendencyButton).not.toBeNull();
    fireEvent.click(tendencyButton!);

    fireEvent.click(await screen.findByRole('button', { name: '继续' }));
    await clickMapGuideReturnToChamber();

    await waitFor(() => {
      expect(screen.getByText(/诵读经典/)).toBeInTheDocument();
      expect(screen.getByText(`体力：${STAMINA_INITIAL_PER_XUN}`)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '诵读经典' }));

    await waitFor(() => {
      expect(screen.getByText('1年1月1旬（上午）')).toBeInTheDocument();
      expect(screen.getByText(`体力：${STAMINA_INITIAL_PER_XUN - 1}`)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '结束本旬' }));

    await waitFor(() => {
      expect(screen.getByText('1年1月2旬（清晨）')).toBeInTheDocument();
      expect(screen.getByText(`体力：${STAMINA_INITIAL_PER_XUN}`)).toBeInTheDocument();
      expect(screen.getByText(/1年1月第2旬清晨通报/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '记下' }));

    await waitFor(() => {
      expect(screen.queryByText(/1年1月第2旬清晨通报/)).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '纪事' }));
    fireEvent.click(await screen.findByRole('button', { name: '事件' }));

    expect(await screen.findByText('1年1月第2旬清晨通报')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`体力按新旬口径恢复为${STAMINA_INITIAL_PER_XUN}`))).toBeInTheDocument();
  });

  it('跨月时会生成月初通报并按月俸结算银两', () => {
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'main',
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        silver: 1000,
        favor: 50,
        prestige: 900,
        flags: {
          ...state.state.flags,
          bedchamberIntroShown: true,
        },
      },
      hiddenStats: {
        ...state.hiddenStats,
        silver: 1000,
        favor: 50,
        prestige: 900,
      },
      time: {
        year: 1,
        month: 1,
        xun: 3,
        slotIndex: 6,
        slot: '深夜',
        slotProgress: 0,
      },
      settlementReports: [],
      latestSettlementReportId: undefined,
      lastSeenSettlementReportId: undefined,
    }));

    useGameFlowStore.getState().advanceTime(1);
    const flow = useGameFlowStore.getState();
    const latestReport = flow.settlementReports.at(-1);

    expect(flow.time).toMatchObject({
      year: 1,
      month: 2,
      xun: 1,
      slot: '清晨',
    });
    expect(flow.state.silver).toBe(1128);
    expect(flow.hiddenStats.silver).toBe(1128);
    expect(latestReport).toMatchObject({
      kind: 'month',
      title: '1年2月月初通报',
    });
    expect(latestReport?.summary).toContain('婕好基础月俸160两');
    expect(latestReport?.summary).toContain('净入账128两');
  });

  it('跨月时会按位分推进更新住处，并在月报里留下迁宫记录', () => {
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'main',
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        residenceName: '椒房殿',
        silver: 1000,
        favor: 45,
        prestige: 1800,
        flags: {
          ...state.state.flags,
          bedchamberIntroShown: true,
        },
      },
      hiddenStats: {
        ...state.hiddenStats,
        silver: 1000,
        favor: 45,
        prestige: 1800,
        initialRank: '皇后',
      },
      time: {
        year: 1,
        month: 1,
        xun: 3,
        slotIndex: 6,
        slot: '深夜',
        slotProgress: 0,
      },
      settlementReports: [],
      latestSettlementReportId: undefined,
      lastSeenSettlementReportId: undefined,
    }));

    useGameFlowStore.getState().advanceTime(1);
    const flow = useGameFlowStore.getState();
    const latestReport = flow.settlementReports.at(-1);

    expect(flow.hiddenStats.initialRank).toBe('德妃 / 淑妃 / 贤妃');
    expect(flow.state.residenceName).toBe('长春宫');
    expect(latestReport?.summary).toContain('位分由皇后调整为德妃 / 淑妃 / 贤妃');
    expect(latestReport?.summary).toContain('居所自椒房殿迁至长春宫');
  });

  it('请平安脉不消耗体力，殿内小酣可恢复体力', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '开始新游戏' }));
    fireEvent.click(await screen.findByRole('button', { name: '确定' }));
    fireEvent.click(await screen.findByRole('button', { name: '确认进入剧情' }));

    fireEvent.click(await screen.findByRole('button', { name: '下一句' }));
    fireEvent.click(await screen.findByRole('button', { name: '听明白了' }));
    fireEvent.click((await screen.findByText('韬光养晦')).closest('button')!);
    fireEvent.click(await screen.findByRole('button', { name: '继续' }));
    await clickMapGuideReturnToChamber();

    await waitFor(() => {
      expect(screen.getByText(/诵读经典/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '请平安脉' }));

    await waitFor(() => {
      expect(useGameFlowStore.getState().state.stamina).toBe(STAMINA_INITIAL_PER_XUN);
      expect(screen.getByText('1年1月1旬（上午）')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '习舞奏乐' }));

    await waitFor(() => {
      expect(useGameFlowStore.getState().state.stamina).toBe(STAMINA_INITIAL_PER_XUN - 2);
    });

    fireEvent.click(screen.getByRole('button', { name: '殿内小酣' }));

    await waitFor(() => {
      expect(useGameFlowStore.getState().state.stamina).toBe(STAMINA_INITIAL_PER_XUN + 1);
      expect(screen.getByText('1年1月1旬（下午）')).toBeInTheDocument();
    });
  });

  it('进入建章宫后会显示太后对话场景与两项固定交互', async () => {
    const defaultFavorTier = getFavorTierByValue(50);
    useGameFlowStore.setState((state) => ({
      ...state,
      currentView: 'bedchamber',
      scene: 'activity',
      activeChamberPanel: 'main',
      activeMapLocation: '建章宫',
      routeId: 'lanyinxuguo',
      state: {
        ...state.state,
        routeId: 'lanyinxuguo',
        openingTendency: '韬光养晦',
        flags: {
          ...state.state.flags,
          bedchamberIntroShown: true,
          mapGuideFinished: true,
        },
      },
      hiddenStats: {
        ...state.hiddenStats,
        favor: 50,
        favorLabel: defaultFavorTier.label,
        favorColor: defaultFavorTier.color,
      },
    }));

    render(<App />);

    expect(await screen.findByText('建章宫 · 拜见太后')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '送礼问安' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '起身告辞' })).toBeInTheDocument();
    expect(screen.getByText(/你需先依礼问安/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '送礼问安' }));

    await waitFor(() => {
      expect(screen.getByText(/肯记得来建章宫尽礼，是好事/)).toBeInTheDocument();
    });
  });
});
