import '../../styles/panels.css'

// A row of tabs for switching between views inside one admin section.
// Reusable: Analytics uses it now, and Studies and Reports will too.

type Tab<T extends string> = {
  id: T
  label: string
}

type Props<T extends string> = {
  tabs: Tab<T>[]
  value: T
  onChange: (id: T) => void
  label: string
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: Props<T>) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === value}
          className={t.id === value ? 'tab is-active' : 'tab'}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}