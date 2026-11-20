import type { ViewMode } from '../hooks/useViewMode'

// Two cards for choosing App view or Website view, each with a small
// drawing of its layout.

type Option = { mode: ViewMode; title: string; text: string }

type Props = {
  label: string
  options: Option[]
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewChoice({ label, options, value, onChange }: Props) {
  return (
    <fieldset className="st2-view">
      <legend className="st2-view-label">{label}</legend>
      <div className="st2-view-options">
        {options.map((o) => {
          const on = o.mode === value
          return (
            <button
              key={o.mode}
              type="button"
              className={on ? 'st2-view-opt is-on' : 'st2-view-opt'}
              aria-pressed={on}
              onClick={() => onChange(o.mode)}
            >
              <span className={`st2-view-pic is-${o.mode}`} aria-hidden="true">
                <span />
              </span>
              <span className="st2-view-title">{o.title}</span>
              <span className="st2-view-text">{o.text}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}