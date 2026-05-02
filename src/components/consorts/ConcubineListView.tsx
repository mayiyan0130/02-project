import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  getConcubineConditionLabel,
  getConcubineDisplayRankText,
  getConcubinePortraitPath,
  getConcubineRankPalette,
  sortConcubinesByStatus,
} from '../../game/data/concubineRoster';
import type { ConcubineProfile, ConcubineStatus } from '../../game/types';

const statusTabs: Array<{ id: ConcubineStatus; label: string }> = [
  { id: 'live', label: '后宫' },
  { id: 'limbo', label: '冷宫' },
  { id: 'deceased', label: '已逝' },
];

const sourceLabelMap: Record<ConcubineProfile['source'], string> = {
  fixed: '固定开局',
  generated: '随机生成',
  custom: '玩家自定义',
};

const formatSignedValue = (value: number): string => (value > 0 ? `+${value}` : String(value));

const getVisitLabel = (status: ConcubineStatus): string => {
  if (status === 'deceased') {
    return '追思';
  }
  if (status === 'limbo') {
    return '探视';
  }
  return '拜访';
};

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

const getMetricPercent = (value: number, range: readonly [number, number]): number => {
  const [min, max] = range;
  if (max <= min) {
    return 0;
  }
  return clampPercent(((value - min) / (max - min)) * 100);
};

interface MetricDescriptor {
  key: string;
  label: string;
  display: string;
  numericValue?: number;
  range?: readonly [number, number];
  accentColor: string;
}

const buildMetricRows = (consort: ConcubineProfile): MetricDescriptor[][] => [
  [
    {
      key: 'prestige',
      label: '声望',
      display: String(consort.stats.prestige),
      numericValue: consort.stats.prestige,
      range: [-2000, 5000],
      accentColor: '#b6634c',
    },
  ],
  [
    {
      key: 'favor',
      label: '宠爱',
      display: String(consort.stats.favor),
      numericValue: consort.stats.favor,
      range: [-100, 100],
      accentColor: '#ca648c',
    },
    {
      key: 'ambition',
      label: '野心',
      display: String(consort.stats.ambition),
      numericValue: consort.stats.ambition,
      range: [-100, 100],
      accentColor: '#8a63c4',
    },
    {
      key: 'stress',
      label: '压力',
      display: String(consort.stats.stress),
      numericValue: consort.stats.stress,
      range: [0, 100],
      accentColor: '#bc7a42',
    },
  ],
  [
    {
      key: 'familyInfluence',
      label: '家世',
      display: String(consort.stats.familyInfluence),
      numericValue: consort.stats.familyInfluence,
      range: [0, 100],
      accentColor: '#92704f',
    },
  ],
  [
    {
      key: 'health',
      label: '健康',
      display: String(consort.stats.health),
      numericValue: consort.stats.health,
      range: [0, 1000],
      accentColor: '#6d8f62',
    },
    {
      key: 'intrigue',
      label: '心计',
      display: String(consort.stats.intrigue),
      numericValue: consort.stats.intrigue,
      range: [0, 1000],
      accentColor: '#6e59a8',
    },
  ],
  [
    {
      key: 'appearance',
      label: '容貌',
      display: String(consort.stats.appearance),
      numericValue: consort.stats.appearance,
      range: [0, 1000],
      accentColor: '#cf7a73',
    },
    {
      key: 'temperament',
      label: '气质',
      display: String(consort.stats.temperament),
      numericValue: consort.stats.temperament,
      range: [0, 1000],
      accentColor: '#7482be',
    },
  ],
  [
    {
      key: 'relationToPlayer',
      label: '好感',
      display: formatSignedValue(consort.stats.relationToPlayer),
      numericValue: consort.stats.relationToPlayer,
      range: [-100, 100],
      accentColor: '#4d92bf',
    },
    {
      key: 'affection',
      label: '倾情',
      display: String(consort.stats.affection),
      numericValue: consort.stats.affection,
      range: [0, 100],
      accentColor: '#c45d93',
    },
  ],
  [
    {
      key: 'personality',
      label: '性格',
      display: consort.personality,
      accentColor: '#8b6c7f',
    },
    {
      key: 'fortune',
      label: '福德',
      display: String(consort.stats.fortune),
      numericValue: consort.stats.fortune,
      range: [-100, 100],
      accentColor: '#aa8547',
    },
  ],
  [
    {
      key: 'childrenCount',
      label: '子嗣',
      display: String(consort.stats.childrenCount),
      accentColor: '#8b7269',
    },
  ],
];

interface ConcubineListViewProps {
  concubines: ConcubineProfile[];
  onClose: () => void;
}

export function ConcubineListView({ concubines, onClose }: ConcubineListViewProps) {
  const [activeStatus, setActiveStatus] = useState<ConcubineStatus>('live');
  const [selectedId, setSelectedId] = useState<string>('');
  const [actionNote, setActionNote] = useState('');
  const [isSocialPanelOpen, setIsSocialPanelOpen] = useState(false);

  const visibleConsorts = useMemo(() => sortConcubinesByStatus(concubines, activeStatus), [activeStatus, concubines]);

  useEffect(() => {
    if (!visibleConsorts.some((consort) => consort.id === selectedId)) {
      setSelectedId(visibleConsorts[0]?.id ?? '');
    }
  }, [selectedId, visibleConsorts]);

  useEffect(() => {
    setActionNote('');
  }, [activeStatus, selectedId]);

  useEffect(() => {
    setIsSocialPanelOpen(false);
  }, [activeStatus, selectedId]);

  const activeConsort = visibleConsorts.find((consort) => consort.id === selectedId) ?? visibleConsorts[0] ?? null;

  if (!activeConsort) {
    return null;
  }

  const currentRankText = getConcubineDisplayRankText(activeConsort);
  const currentRankPalette = getConcubineRankPalette(activeConsort);
  const visitLabel = getVisitLabel(activeConsort.status);
  const metricRows = buildMetricRows(activeConsort);
  const currentConditionLabel = getConcubineConditionLabel(activeConsort);
  const noteText =
    actionNote ||
    `家世：${activeConsort.familyBackground}。${activeConsort.summary} 来源：${sourceLabelMap[activeConsort.source]}${
      activeConsort.isCustomConsort ? '，后续可继续扩展自定义剧情。' : '。'
    }`;

  return (
    <section className="concubine-list-view" aria-label="嫔妃总览面板">
      <aside className="concubine-list-view__sidebar" aria-label="嫔妃状态与名单">
        <div className="concubine-list-view__tabs" role="tablist" aria-label="嫔妃状态切换">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeStatus === tab.id}
              className={`concubine-list-view__tab ${activeStatus === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveStatus(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="concubine-list-view__entries" role="list" aria-label={`${statusTabs.find((tab) => tab.id === activeStatus)?.label} 名单`}>
          {visibleConsorts.map((consort) => (
            <button
              key={consort.id}
              type="button"
              role="listitem"
              aria-label={`${getConcubineDisplayRankText(consort)} ${consort.name}`}
              className={`concubine-list-view__entry ${selectedId === consort.id ? 'is-active' : ''}`}
              onClick={() => setSelectedId(consort.id)}
            >
              <span className="concubine-list-view__entry-label">
                <span className="concubine-list-view__entry-rank" style={{ color: getConcubineRankPalette(consort).rankColor }}>
                  {getConcubineDisplayRankText(consort)}
                </span>
                {' '}
                <span className="concubine-list-view__entry-name" style={{ color: getConcubineRankPalette(consort).nameColor }}>
                  {consort.name}
                </span>
              </span>
            </button>
          ))}
        </div>

        <button type="button" className="concubine-list-view__back" onClick={onClose}>
          返回
        </button>
      </aside>

      <div className="concubine-list-view__detail-surface" aria-hidden="true" />

      <div className="concubine-list-view__chips" aria-label="当前嫔妃信息栏">
        <div className="concubine-list-view__chip concubine-list-view__chip--primary">
          <span className="concubine-list-view__chip-rank" style={{ color: currentRankPalette.rankColor }}>
            {currentRankText}
          </span>
          {' '}
          <span className="concubine-list-view__chip-name" style={{ color: currentRankPalette.nameColor }}>
            {activeConsort.name}
          </span>
        </div>
        <div className="concubine-list-view__chip concubine-list-view__chip--secondary">{activeConsort.residence}</div>
        <div className="concubine-list-view__chip concubine-list-view__chip--secondary">{`状态 ${currentConditionLabel}`}</div>
      </div>

      <div className="concubine-list-view__action-group" aria-label="嫔妃动作按钮">
        <button
          type="button"
          className="concubine-list-view__visit"
          onClick={() => {
            setIsSocialPanelOpen(false);
            setActionNote(
              activeConsort.status === 'deceased'
                ? `关于${activeConsort.name}的追思入口已预留，后续会接入纪事回溯与旧案线索。`
                : `${activeConsort.name}的${visitLabel}入口已预留，后续会接入正式串门、好感变化与事件分支。`,
            );
          }}
        >
          {visitLabel}
        </button>
        <button
          type="button"
          className={`concubine-list-view__social-toggle ${isSocialPanelOpen ? 'is-active' : ''}`}
          onClick={() => setIsSocialPanelOpen(true)}
        >
          人际
        </button>
      </div>

      <section className="concubine-list-view__metric-board" aria-label="嫔妃核心属性">
        {metricRows.map((row, rowIndex) => (
          <div
            key={`metric-row-${rowIndex}`}
            className={`concubine-list-view__metric-row-group concubine-list-view__metric-row-group--${row.length}`}
          >
            {row.map((metric) => {
              const meterStyle =
                metric.range && typeof metric.numericValue === 'number'
                  ? ({
                      '--metric-fill': metric.accentColor,
                      '--metric-level': `${getMetricPercent(metric.numericValue, metric.range)}%`,
                    } as CSSProperties)
                  : undefined;
              const isSignedRange = Boolean(metric.range && metric.range[0] < 0);
              return (
                <article
                  key={metric.key}
                  className={`concubine-list-view__metric-card ${metric.range ? '' : 'is-text-only'}`}
                  style={meterStyle}
                >
                  <div className="concubine-list-view__metric-copy">
                    <span>{metric.label}</span>
                    <strong>{metric.display}</strong>
                  </div>
                  {metric.range ? (
                    <div
                      className={`concubine-list-view__metric-meter ${isSignedRange ? 'is-signed' : ''}`}
                      aria-hidden="true"
                    >
                      <div className="concubine-list-view__metric-meter-fill" />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ))}
      </section>

      {isSocialPanelOpen ? (
        <section className="concubine-list-view__social-panel" aria-label="嫔妃人际关系">
          <header className="concubine-list-view__social-header">
            <h3>人际</h3>
            <button type="button" onClick={() => setIsSocialPanelOpen(false)}>
              收起
            </button>
          </header>
          <article className="concubine-list-view__social-group">
            <span>交好</span>
            <div className="concubine-list-view__social-pills">
              {activeConsort.allies.length > 0 ? (
                activeConsort.allies.map((name) => (
                  <span key={name} className="concubine-list-view__social-pill is-ally">
                    {name}
                  </span>
                ))
              ) : (
                <span className="concubine-list-view__social-empty">暂无明显交好对象</span>
              )}
            </div>
          </article>
          <article className="concubine-list-view__social-group">
            <span>交恶</span>
            <div className="concubine-list-view__social-pills">
              {activeConsort.rivals.length > 0 ? (
                activeConsort.rivals.map((name) => (
                  <span key={name} className="concubine-list-view__social-pill is-rival">
                    {name}
                  </span>
                ))
              ) : (
                <span className="concubine-list-view__social-empty">暂无明显交恶对象</span>
              )}
            </div>
          </article>
        </section>
      ) : null}

      <p className={`concubine-list-view__note ${isSocialPanelOpen ? 'is-hidden' : ''}`}>{noteText}</p>

      <section className="concubine-list-view__portrait-stage" aria-label={`${activeConsort.name}立绘`}>
        <img
          src={getConcubinePortraitPath(activeConsort.portraitId)}
          alt={activeConsort.name}
          className="concubine-list-view__portrait"
        />
      </section>
    </section>
  );
}
