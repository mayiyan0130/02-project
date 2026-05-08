import type { ReactNode } from 'react';
import { DIALOGUE_CONFIG } from '../../config/dialogueConfig';
import { GlobalDialogue } from './PalaceDialogueBox';

interface GlobalDialogueOption {
  id: string;
  label: string;
  effectHint?: string;
}

interface GlobalDialogueStageProps {
  sceneLabel: string;
  portraitLabel: string;
  portrait: ReactNode;
  characterIdentity: string;
  characterName: string;
  content: string;
  ariaLabel?: string;
  className?: string;
  dialogueClassName?: string;
  nextActionLabel?: string;
  onNextAction?: (() => void) | undefined;
  options?: GlobalDialogueOption[];
  onSelectOption?: ((optionId: string) => void) | undefined;
  busy?: boolean;
}

export function GlobalDialogueStage({
  sceneLabel,
  portraitLabel,
  portrait,
  characterIdentity,
  characterName,
  content,
  ariaLabel,
  className = '',
  dialogueClassName = '',
  nextActionLabel,
  onNextAction,
  options = [],
  onSelectOption,
  busy = false,
}: GlobalDialogueStageProps) {
  const rootClassName = ['global-dialogue-stage', className].filter(Boolean).join(' ');
  const boxClassName = ['palace-dialogue-box--global-lock', dialogueClassName].filter(Boolean).join(' ');

  return (
    <section className={rootClassName} aria-label={sceneLabel} data-dialogue-lock={DIALOGUE_CONFIG.lockVersion}>
      <div className="global-dialogue-stage__portrait-stage" aria-label={portraitLabel}>
        <div className="global-dialogue-stage__portrait-frame">{portrait}</div>
      </div>

      <GlobalDialogue
        ariaLabel={ariaLabel}
        className={boxClassName}
        characterIdentity={characterIdentity}
        characterName={characterName}
        content={content}
        nextActionLabel={nextActionLabel}
        onNextAction={onNextAction}
        options={options}
        onSelectOption={onSelectOption}
        busy={busy}
      />
    </section>
  );
}
