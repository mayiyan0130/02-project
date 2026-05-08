import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ConsortAudiencePanel } from './ConsortAudiencePanel';
import { HAREM_PALACES, type HaremPalaceId } from '../../config/haremPalaces';
import { HAREM_OVERVIEW_BACKGROUND } from '../../config/locationSceneBackgrounds';
import type { ConcubineProfile } from '../../game/types';

interface HaremPalaceViewProps {
  concubines: ConcubineProfile[];
}

interface HallOccupancy {
  hallId: string;
  residence: string;
  residents: ConcubineProfile[];
}

export function HaremPalaceView({ concubines }: HaremPalaceViewProps) {
  const [selectedPalaceId, setSelectedPalaceId] = useState<HaremPalaceId | null>(null);
  const [selectedHallId, setSelectedHallId] = useState<string | null>(null);
  const [activeResidentId, setActiveResidentId] = useState<string | null>(null);

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

  const hallOccupancy = useMemo<HallOccupancy[]>(() => {
    if (!selectedPalace) {
      return [];
    }

    return selectedPalace.halls.map((hall) => {
      const residence = `${selectedPalace.label}${hall.suffix}`;
      const residents = concubines.filter(
        (concubine) => concubine.status === 'live' && concubine.residence === residence,
      );

      return {
        hallId: hall.id,
        residence,
        residents,
      };
    });
  }, [concubines, selectedPalace]);

  const selectedHallOccupancy = useMemo(
    () => hallOccupancy.find((entry) => entry.hallId === selectedHallId) ?? null,
    [hallOccupancy, selectedHallId],
  );

  const activeResident = useMemo(
    () => concubines.find((consort) => consort.id === activeResidentId) ?? null,
    [activeResidentId, concubines],
  );

  const footerCopy = selectedHall
    ? selectedHallOccupancy && selectedHallOccupancy.residents.length > 0
      ? `当前查看：${selectedHall.suffix}。现居：${selectedHallOccupancy.residents
          .map((resident) => `${resident.rankLabel} ${resident.name}`)
          .join('、')}。`
      : `当前查看：${selectedHall.suffix}。此殿当前暂无妃嫔入住。`
    : selectedPalace
      ? '该宫现展示为一主殿、二侧殿、三偏殿布局。'
      : '点击任一宫殿，可进入该宫的一主殿、二侧殿、三偏殿布局。';

  const renderHallButton = (hall: (typeof HAREM_PALACES)[number]['halls'][number]) => {
    const occupancy = hallOccupancy.find((entry) => entry.hallId === hall.id);
    const hasResidents = Boolean(occupancy && occupancy.residents.length > 0);

    return (
      <button
        key={hall.id}
        type="button"
        className={`harem-palace-view__hall-button ${selectedHallId === hall.id ? 'is-active' : ''} ${hasResidents ? 'is-occupied' : ''}`}
        onClick={() => {
          setSelectedHallId(hall.id);
          if (occupancy && occupancy.residents.length > 0) {
            setActiveResidentId(occupancy.residents[0].id);
          }
        }}
      >
        <strong>{hall.suffix}</strong>
        <div className="harem-palace-view__hall-residents">
          {hasResidents ? (
            occupancy?.residents.map((resident) => (
              <span key={resident.id} className="harem-palace-view__hall-resident">
                {resident.rankLabel} {resident.name}
              </span>
            ))
          ) : (
            <span className="harem-palace-view__hall-empty">暂无妃嫔</span>
          )}
        </div>
      </button>
    );
  };

  return (
    <section className="harem-palace-view" style={panelStyle} aria-label="后宫宫殿总览">
      <div className="harem-palace-view__veil" aria-hidden="true" />

      {selectedPalace && !activeResident ? (
        <header className="harem-palace-view__header harem-palace-view__header--detail">
          <div className="harem-palace-view__heading">
            <span>宫内分布</span>
            <h2>{selectedPalace.label}</h2>
            <p>一主殿、二侧殿、三偏殿</p>
          </div>

          <div className="harem-palace-view__header-actions">
            <button type="button" className="harem-palace-view__utility-button" onClick={() => setSelectedPalaceId(null)}>
              返回宫苑
            </button>
          </div>
        </header>
      ) : (
        <header className="harem-palace-view__header harem-palace-view__header--overview" aria-hidden="true" />
      )}

      {selectedPalace && activeResident && selectedHall ? (
        <ConsortAudiencePanel
          consort={activeResident}
          palaceLabel={selectedPalace.label}
          hallLabel={selectedHall.suffix}
          concubines={concubines}
          onBack={() => setActiveResidentId(null)}
        />
      ) : selectedPalace ? (
        <div className="harem-palace-view__hall-layout" aria-label={`${selectedPalace.label} 殿位布局`}>
          <div className="harem-palace-view__hall-row harem-palace-view__hall-row--main">
            {selectedPalace.halls.slice(0, 1).map(renderHallButton)}
          </div>

          <div className="harem-palace-view__hall-row harem-palace-view__hall-row--side">
            {selectedPalace.halls.slice(1, 3).map(renderHallButton)}
          </div>

          <div className="harem-palace-view__hall-row harem-palace-view__hall-row--wing">
            {selectedPalace.halls.slice(3).map(renderHallButton)}
          </div>

          <button
            type="button"
            className="harem-palace-view__detail-return"
            onClick={() => setSelectedPalaceId(null)}
          >
            返回
          </button>
        </div>
      ) : (
        <div className="harem-palace-view__grid harem-palace-view__grid--overview" aria-label="十二宫按钮">
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

      {!activeResident ? (
        <footer className="harem-palace-view__footer">
          <p>{footerCopy}</p>
        </footer>
      ) : null}
    </section>
  );
}
