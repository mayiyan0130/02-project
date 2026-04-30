/* @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { STAMINA_INITIAL_PER_XUN } from '../config/constants';
import { buildInitialBondProfile } from '../game/data/bondPresets';
import { buildInitialConcubineRoster } from '../game/data/concubineRoster';
import { useGameFlowStore } from '../game/store/gameFlowStore';

const resetFlowStore = () => {
  useGameFlowStore.setState((state) => ({
    ...state,
    currentView: 'start',
    scene: 'menu',
    activeChamberPanel: 'main',
    routeId: 'lanyinxuguo',
    state: {
      ...state.state,
      routeId: 'lanyinxuguo',
      openingTendency: undefined,
      stamina: STAMINA_INITIAL_PER_XUN,
      flags: {},
    },
    selectedRoute: undefined,
    dialogue: undefined,
    mapEventText: '',
    bondProfile: buildInitialBondProfile('lanyinxuguo', '1-1-1'),
    concubineRouteId: 'lanyinxuguo',
    concubines: buildInitialConcubineRoster('lanyinxuguo'),
    customConsorts: [],
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

    expect(await screen.findByText('贴身宫女 · 娇娇')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一句' })).toBeInTheDocument();
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

  it('寝殿情缘面板可在无 AI 时用本地标签完成关系判定', async () => {
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

    expect(await screen.findByText('当前对象')).toBeInTheDocument();
    fireEvent.click((await screen.findByText('含笑试探')).closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('最近判定：暧昧 · 本地回退')).toBeInTheDocument();
      expect(screen.getByText('本旬净变动 +1 / 5')).toBeInTheDocument();
    });
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
    expect((await screen.findAllByText(/庶人 杜若蘅/)).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('tab', { name: '已逝' }));
    expect((await screen.findAllByText(/悼嫔 冯妙莲/)).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: '返回' }));
    await waitFor(() => {
      expect(screen.queryByLabelText('嫔妃总览面板')).not.toBeInTheDocument();
    });
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
});
