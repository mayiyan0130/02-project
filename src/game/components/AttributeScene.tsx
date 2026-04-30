import { useMemo, useState } from 'react';
import { attributeFields } from '../data/config';
import { gameApi } from '../lib/gameApi';
import { useGameFlowStore } from '../store/gameFlowStore';

interface AttributeSceneProps {
  onNotice: (message: string) => void;
}

const familyByRoute = {
  lanyinxuguo: ['镇国公嫡女', '正一品文官嫡女', '从二品武官义女', '正三品文官庶女'],
  fushengrumeng: ['六品武官嫡女', '四品文官庶女', '商贾之女'],
  yingluoyeting: ['罪臣之后', '四品文官嫡女', '二品文官庶女'],
  chenyuansucuo: ['和亲公主', '异国贡女', '五品文官义女'],
} as const;

export function AttributeScene({ onNotice }: AttributeSceneProps) {
  const { state, routeId, patchState, setAttributeValue, setSave, setBriefing, setScene } = useGameFlowStore();
  const [pending, setPending] = useState(false);

  const fields = useMemo(() => {
    return attributeFields.map((field) => {
      const max = field.key === 'politics' && !['lanyinxuguo', 'chenyuansucuo'].includes(routeId) ? 2 : field.max;
      return { ...field, value: state.stats[field.key] ?? field.value, max };
    });
  }, [routeId, state.stats]);

  const adjustValue = (key: string, next: number, min: number, max: number) => {
    const current = state.stats[key] ?? 0;
    const clamped = Math.min(max, Math.max(min, next));
    const delta = clamped - current;
    if (delta > 0 && state.pointsLeft < delta) {
      onNotice('剩余点数不足。');
      return;
    }
    setAttributeValue(key, clamped);
    patchState({ pointsLeft: Math.max(0, state.pointsLeft - delta) });
  };

  const submit = async () => {
    setPending(true);
    try {
      const recorded = await gameApi.recordAttributes(state);
      const briefing = await gameApi.createBriefing(recorded.state);
      patchState(recorded.state);
      setSave(recorded.save);
      setBriefing(briefing.summary);
      setScene('briefing');
      onNotice('属性已存档，并已生成剧情简报。');
    } catch (error) {
      onNotice(error instanceof Error ? error.message : '属性记录失败，请重试。');
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="gal-scene gal-scene--attribute" style={{ backgroundImage: "url('/assets/ui/attribute-ui.png')" }}>
      <div className="gal-overlay gal-overlay--panel" />
      <div className="gal-attribute-shell">
        <div className="gal-attribute-header">
          <label>
            姓名
            <input value={state.name} onChange={(event) => patchState({ name: event.target.value })} />
          </label>
          <label>
            家世
            <select value={state.family} onChange={(event) => patchState({ family: event.target.value })}>
              {familyByRoute[routeId].map((family) => (
                <option key={family} value={family}>{family}</option>
              ))}
            </select>
          </label>
          <label>
            年龄
            <input type="number" min={15} max={23} value={state.age} onChange={(event) => patchState({ age: Number(event.target.value) })} />
          </label>
          <div className="gal-points">剩余资质点：{state.pointsLeft}</div>
        </div>
        <div className="gal-attribute-grid">
          {fields.map((field) => {
            const factor = field.key === 'fortune' ? 10 : field.min >= 2 ? 100 : 10;
            const gameValue = (state.stats[field.key] ?? field.value) * factor;
            return (
              <div key={field.key} className="gal-attribute-card">
                <div>
                  <strong>{field.label}</strong>
                  <span>{field.note}</span>
                </div>
                <div className="gal-stepper">
                  <button type="button" onClick={() => adjustValue(field.key, (state.stats[field.key] ?? field.value) - 1, field.min, field.max)}>-</button>
                  <div>
                    <b>{state.stats[field.key] ?? field.value}</b>
                    <small>游戏值 {gameValue}</small>
                  </div>
                  <button type="button" onClick={() => adjustValue(field.key, (state.stats[field.key] ?? field.value) + 1, field.min, field.max)}>+</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="gal-attribute-actions">
          <button type="button" onClick={() => patchState({ pointsLeft: 0, stats: { ...state.stats, health: 5, fortune: 3, intrigue: 6, appearance: 5, temperament: 5, talent: 4, painting: 3, embroidery: 2, medicine: 2, politics: routeId === 'lanyinxuguo' || routeId === 'chenyuansucuo' ? 2 : 1 } })}>自动分配</button>
          <button type="button" disabled={pending} onClick={submit}>{pending ? '记录中...' : '确认入宫'}</button>
        </div>
      </div>
    </section>
  );
}
