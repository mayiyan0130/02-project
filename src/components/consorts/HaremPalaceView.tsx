import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { HAREM_PALACES, type HaremPalaceId } from '../../config/haremPalaces';
import { HAREM_OVERVIEW_BACKGROUND } from '../../config/locationSceneBackgrounds';

interface HaremPalaceViewProps {
  onClose: () => void;
}

export function HaremPalaceView({ onClose }: HaremPalaceViewProps) {
  const [selectedPalaceId, setSelectedPalaceId] = useState<HaremPalaceId | null>(null);
  const [selectedHallId, setSelectedHallId] = useState<string | null>(null);

  const selectedPalace = useMemo(
    () => HAREM_PALACES.find((palace) => palace.id === selectedPalaceId) ?? null,
    [selectedPalaceId],
  );

  const selectedHall = useMemo(
    () => selectedPalace?.halls.find((hall) => hall.id === selectedHallId) ?? null,
    [selectedHallId, selectedPalace],
  );

  const panelStyle = useMemo<CSSProperties>(
    () => ({
      backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.08)), url("${
        selectedPalace?.background ?? HAREM_OVERVIEW_BACKGROUND
      }")`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
    }),
    [selectedPalace],
  );

  useEffect(() => {
    setSelectedHallId(null);
  }, [selectedPalaceId]);

  const footerCopy = selectedHall
    ? `当前查看：${selectedHall.prefix}·${selectedHall.suffix}。`
    : selectedPalace
      ? '该宫现展示为一主殿、二侧殿、三偏殿布局。'
      : '点击任一宫殿，可进入该宫的一主殿、二侧殿、三偏殿布局。';

  return (
    <section className="harem-palace-view" style={panelStyle} aria-label="后宫宫殿总览">
      <div className="harem-palace-view__veil" aria-hidden="true" />

      <header className="harem-palace-view__header">
        <div className="harem-palace-view__heading">
          <span>{selectedPalace ? '宫内分布' : '后宫总览'}</span>
          <h2>{selectedPalace ? selectedPalace.label : '十二宫'}</h2>
          <p>{selectedPalace ? '一主殿、二侧殿、三偏殿' : '浅米色宫殿按钮总览'}</p>
        </div>

        <div className="harem-palace-view__header-actions">
          {selectedPalace ? (
            <button type="button" className="harem-palace-view__utility-button" onClick={() => setSelectedPalaceId(null)}>
              返回宫苑
            </button>
          ) : null}
          <button type="button" className="harem-palace-view__utility-button is-secondary" onClick={onClose}>
            收起
          </button>
        </div>
      </header>

      {selectedPalace ? (
        <div className="harem-palace-view__hall-layout" aria-label={`${selectedPalace.label} 殿位布局`}>
          <div className="harem-palace-view__hall-row harem-palace-view__hall-row--main">
            {selectedPalace.halls.slice(0, 1).map((hall) => (
              <button
                key={hall.id}
                type="button"
                className={`harem-palace-view__hall-button ${selectedHallId === hall.id ? 'is-active' : ''}`}
                onClick={() => setSelectedHallId(hall.id)}
              >
                <strong>{hall.prefix}</strong>
                <span>{hall.suffix}</span>
              </button>
            ))}
          </div>

          <div className="harem-palace-view__hall-row harem-palace-view__hall-row--side">
            {selectedPalace.halls.slice(1, 3).map((hall) => (
              <button
                key={hall.id}
                type="button"
                className={`harem-palace-view__hall-button ${selectedHallId === hall.id ? 'is-active' : ''}`}
                onClick={() => setSelectedHallId(hall.id)}
              >
                <strong>{hall.prefix}</strong>
                <span>{hall.suffix}</span>
              </button>
            ))}
          </div>

          <div className="harem-palace-view__hall-row harem-palace-view__hall-row--wing">
            {selectedPalace.halls.slice(3).map((hall) => (
              <button
                key={hall.id}
                type="button"
                className={`harem-palace-view__hall-button ${selectedHallId === hall.id ? 'is-active' : ''}`}
                onClick={() => setSelectedHallId(hall.id)}
              >
                <strong>{hall.prefix}</strong>
                <span>{hall.suffix}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="harem-palace-view__grid" aria-label="十二宫按钮">
          {HAREM_PALACES.map((palace) => (
            <button
              key={palace.id}
              type="button"
              className="harem-palace-view__palace-button"
              onClick={() => setSelectedPalaceId(palace.id)}
            >
              <span>{palace.label}</span>
            </button>
          ))}
        </div>
      )}

      <footer className="harem-palace-view__footer">
        <p>{footerCopy}</p>
      </footer>
    </section>
  );
}
