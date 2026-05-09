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
  controlsDisabled?: boolean;
  typewriter?: boolean;
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
  controlsDisabled = busy,
  typewriter,
}: GlobalDialogueStageProps) {
  const rootClassName = ['global-dialogue-stage', className].filter(Boolean).join(' ');
  const boxClassName = ['palace-dialogue-box--global-lock', dialogueClassName].filter(Boolean).join(' ');
  const hasOptions = options.length > 0;

  return (
    <section className={rootClassName} aria-label={sceneLabel} data-dialogue-lock={DIALOGUE_CONFIG.lockVersion}>
      <div className="global-dialogue-stage__portrait-stage" aria-label={portraitLabel}>
        <div className="global-dialogue-stage__portrait-frame">{portrait}</div>
      </div>

      {hasOptions ? (
        <div className="global-dialogue-stage__options palace-dialogue-box__options" role="group" aria-label="对话分支选项">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="palace-dialogue-box__option"
              onClick={() => onSelectOption?.(option.id)}
              disabled={controlsDisabled || !onSelectOption}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}

      <GlobalDialogue
        ariaLabel={ariaLabel}
        className={boxClassName}
        characterIdentity={characterIdentity}
        characterName={characterName}
        content={content}
        nextActionLabel={nextActionLabel}
        onNextAction={onNextAction}
        options={[]}
        onSelectOption={undefined}
        busy={busy}
        controlsDisabled={controlsDisabled}
        typewriter={typewriter}
      />
    </section>
  );
}
