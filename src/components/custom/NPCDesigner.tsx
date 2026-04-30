import { useState } from 'react';
import type { NPCProfile, PaletteKey } from '../../types/game';

interface NPCDesignerProps {
  onCreate: (npc: NPCProfile) => void;
}

const defaultPalette: PaletteKey = 'violet';

export function NPCDesigner({ onCreate }: NPCDesignerProps) {
  const [name, setName] = useState('');

  return (
    <section className="npc-designer">
      <h3>自定义妃子</h3>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="输入妃子名" />
      <button
        type="button"
        onClick={() =>
          onCreate({
            id: `custom-${Date.now()}`,
            name: name || '新妃嫔',
            rankId: 'guiren',
            palette: defaultPalette,
            disposition: '待补完设定',
            blackened: 0,
            custom: true,
            stats: { charm: 60, intrigue: 50 },
          })
        }
      >
        保存设定
      </button>
    </section>
  );
}
