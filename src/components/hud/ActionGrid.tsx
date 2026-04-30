interface ActionGridProps {
  actions: string[];
  busy?: boolean;
  onSelect: (action: string) => void;
}

export function ActionGrid({ actions, busy = false, onSelect }: ActionGridProps) {
  return (
    <section className="action-grid">
      {actions.map((action) => (
        <button key={action} type="button" disabled={busy} onClick={() => onSelect(action)}>
          {action}
        </button>
      ))}
    </section>
  );
}
