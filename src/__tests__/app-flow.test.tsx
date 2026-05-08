/* @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { getFavorTierByValue, STAMINA_INITIAL_PER_XUN } from '../config/constants';
import { buildInitialBondProfile } from '../game/data/bondPresets';
import { buildInitialConcubineRoster } from '../game/data/concubineRoster';
import { cloneInitialInventory } from '../game/data/inventoryPresets';
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

describe('App 主流程切换', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    localStorage.clear();
    resetFlowStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('可从开始页进入路线选择页', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '开始新游戏' }));

    expect(await screen.findByText('通关要求')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '确定' })).toBeInTheDocument();
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
    fireEvent.click(await screen.findByRole('button', { name: '回宫' }));

    await waitFor(() => {
      expect(screen.getByText(/诵读经典/)).toBeInTheDocument();
      expect(screen.queryByText(/更换装扮/)).not.toBeInTheDocument();
    });
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
    fireEvent.click(await screen.findByRole('button', { name: '回宫' }));
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
    fireEvent.click(await screen.findByRole('button', { name: '回宫' }));

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

    fireEvent.click(screen.getByRole('button', { name: '问好' }));

    expect(await screen.findByText(/妾自当好生应答/)).toBeInTheDocument();
    expect(screen.getByText('温声再问一句')).toBeInTheDocument();
    expect(screen.getByText('借话轻轻试探')).toBeInTheDocument();
    expect(screen.getByText('只把礼数做满')).toBeInTheDocument();
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

  it('结束本旬后会进入下一旬清晨并按新旬规则重算体力', async () => {
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
    fireEvent.click(await screen.findByRole('button', { name: '回宫' }));

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
    });
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
    fireEvent.click(await screen.findByRole('button', { name: '回宫' }));

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
