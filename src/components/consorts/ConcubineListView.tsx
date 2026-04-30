import { useEffect, useMemo, useState } from 'react';
import { getConcubineListLabel, getConcubinePortraitPath, sortConcubinesByStatus } from '../../game/data/concubineRoster';
import type { ConcubineProfile, ConcubineStatus } from '../../game/types';

const statusTabs: Array<{ id: ConcubineStatus; label: string }> = [
  { id: 'live', label: '后宫' },
  { id: 'limbo', label: '冷宫' },
  { id: 'deceased', label: '已逝' },
];

const titleColorMap: Record<string, string> = {
  皇后: '#d63a3a',
  皇贵妃: '#c647a7',
  贵妃: '#be4ab0',
  淑妃: '#6a65d6',
  德妃: '#4f9ed2',
  贤妃: '#55a4cb',
  妃: '#8e58b7',
  昭仪: '#c058a0',
  昭容: '#7a63c7',
  婕妤: '#5c7ad7',
  嫔: '#3aa1c5',
  贵人: '#9a5eb2',
  美人: '#6b7fd7',
  才人: '#bf6697',
  宝林: '#8a7996',
  常在: '#8f7078',
  答应: '#8a747d',
  庶人: '#7b6d75',
};

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

interface ConcubineListViewProps {
  concubines: ConcubineProfile[];
  onClose: () => void;
}

export function ConcubineListView({ concubines, onClose }: ConcubineListViewProps) {
  const [activeStatus, setActiveStatus] = useState<ConcubineStatus>('live');
  const [selectedId, setSelectedId] = useState<string>('');
  const [actionNote, setActionNote] = useState('');

  const visibleConsorts = useMemo(() => sortConcubinesByStatus(concubines, activeStatus), [activeStatus, concubines]);

  useEffect(() => {
    if (!visibleConsorts.some((consort) => consort.id === selectedId)) {
      setSelectedId(visibleConsorts[0]?.id ?? '');
    }
  }, [selectedId, visibleConsorts]);

  useEffect(() => {
    setActionNote('');
  }, [activeStatus, selectedId]);

  const activeConsort = visibleConsorts.find((consort) => consort.id === selectedId) ?? visibleConsorts[0] ?? null;

  const metricsLeft = activeConsort
    ? [
        ['声望', activeConsort.stats.prestige],
        ['宠爱', activeConsort.stats.favor],
        ['家世', activeConsort.stats.familyInfluence],
        ['体质', activeConsort.stats.health],
        ['容貌', activeConsort.stats.appearance],
        ['好感', formatSignedValue(activeConsort.stats.relationToPlayer)],
        ['性格', activeConsort.personality],
        ['子嗣', activeConsort.stats.childrenCount],
      ]
    : [];

  const metricsRight = activeConsort
    ? [
        ['野心', activeConsort.stats.ambition],
        ['压力', activeConsort.stats.stress],
        ['心计', activeConsort.stats.intrigue],
        ['气质', activeConsort.stats.temperament],
        ['倾情', activeConsort.stats.affection],
        ['福德', activeConsort.stats.fortune],
      ]
    : [];

  if (!activeConsort) {
    return null;
  }

  const titleColor = titleColorMap[activeConsort.status === 'limbo' ? '庶人' : activeConsort.rankLabel] ?? '#5b2b2f';
  const visitLabel = getVisitLabel(activeConsort.status);
  const noteText =
    actionNote ||
    `${activeConsort.summary} 来源：${sourceLabelMap[activeConsort.source]}${
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
              className={`concubine-list-view__entry ${selectedId === consort.id ? 'is-active' : ''}`}
              onClick={() => setSelectedId(consort.id)}
            >
              <span
                className="concubine-list-view__entry-label"
                style={{ color: titleColorMap[consort.status === 'limbo' ? '庶人' : consort.rankLabel] ?? '#5b2b2f' }}
              >
                {getConcubineListLabel(consort)}
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
        <div className="concubine-list-view__chip concubine-list-view__chip--primary" style={{ color: titleColor }}>
          {getConcubineListLabel(activeConsort)}
        </div>
        <div className="concubine-list-view__chip">{activeConsort.residence}</div>
        <div className="concubine-list-view__chip">{`状态 ${activeConsort.stateLabel}`}</div>
      </div>

      <button
        type="button"
        className="concubine-list-view__visit"
        onClick={() =>
          setActionNote(
            activeConsort.status === 'deceased'
              ? `关于${activeConsort.name}的追思入口已预留，后续会接入纪事回溯与旧案线索。`
              : `${activeConsort.name}的${visitLabel}入口已预留，后续会接入正式串门、好感变化与事件分支。`,
          )
        }
      >
        {visitLabel}
      </button>

      <section className="concubine-list-view__metric-columns" aria-label="嫔妃核心属性">
        <div className="concubine-list-view__metric-column">
          {metricsLeft.map(([label, value]) => (
            <div key={label} className="concubine-list-view__metric-row">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="concubine-list-view__metric-column">
          {metricsRight.map(([label, value]) => (
            <div key={label} className="concubine-list-view__metric-row">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="concubine-list-view__relations" aria-label="嫔妃社交关系">
        <article className="concubine-list-view__relation-block">
          <h3>交好</h3>
          <p>{activeConsort.allies.length > 0 ? activeConsort.allies.join('、') : '暂无明显交好对象'}</p>
        </article>
        <article className="concubine-list-view__relation-block">
          <h3>交恶</h3>
          <p>{activeConsort.rivals.length > 0 ? activeConsort.rivals.join('、') : '暂无明显交恶对象'}</p>
        </article>
      </section>

      <p className="concubine-list-view__note">{noteText}</p>

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
