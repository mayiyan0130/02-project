/**
 * @typedef {{
 *   id: string
 *   label: string
 *   effectHint?: string
 * }} PalaceDialogueOption
 */

/**
 * @param {{
 *   characterIdentity: string
 *   characterName: string
 *   content: string
 *   ariaLabel?: string
 *   className?: string
 *   nextActionLabel?: string
 *   onNextAction?: (() => void) | undefined
 *   options?: PalaceDialogueOption[]
 *   onSelectOption?: ((optionId: string) => void) | undefined
 *   busy?: boolean
 * }} props
 */
export function PalaceDialogueBox({
  characterIdentity,
  characterName,
  content,
  ariaLabel = '宫廷对话框',
  className = '',
  nextActionLabel,
  onNextAction,
  options = [],
  onSelectOption,
  busy = false,
}) {
  const rootClassName = ['palace-dialogue-box', className].filter(Boolean).join(' ');
  const hasOptions = options.length > 0;

  return (
    <section className={rootClassName} aria-label={ariaLabel}>
      {hasOptions ? (
        <div className="palace-dialogue-box__options" role="group" aria-label="对话分支选项">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="palace-dialogue-box__option"
              onClick={() => onSelectOption?.(option.id)}
              disabled={busy || !onSelectOption}
            >
              <span>{option.label}</span>
              {option.effectHint ? <small>{option.effectHint}</small> : null}
            </button>
          ))}
        </div>
      ) : null}

      <div className="palace-dialogue-box__content">
        <header className="palace-dialogue-box__speaker">{`${characterIdentity} · ${characterName}`}</header>
        <div className="palace-dialogue-box__text-container" aria-busy={busy}>
          <p className="palace-dialogue-box__text">{content}</p>
        </div>
        {!hasOptions && nextActionLabel ? (
          <button
            type="button"
            className="palace-dialogue-box__next"
            onClick={onNextAction}
            disabled={busy || !onNextAction}
          >
            {nextActionLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
