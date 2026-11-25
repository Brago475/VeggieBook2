import { useStrings } from '../../i18n/useStrings'
import type { Combo } from '../api/combosApi'
import { ST_COMBOS } from '../strings/combos'
import { count } from '../utils/format'

// Saved combos with Add and Remove.

type Props = {
  combos: Combo[]
  busy: boolean
  onAdd: (combo: Combo) => void
  onRemove: (combo: Combo) => void
}

export function ComboList({ combos, busy, onAdd, onRemove }: Props) {
  const t = useStrings(ST_COMBOS)

  if (combos.length === 0) return <p className="st2-hint">{t.noCombos}</p>

  return (
    <ul className="st2-results">
      {combos.map((c) => (
        <li key={c.id} className="st2-combo">
          <div className="st2-combo-text">
            <span className="st2-result-name">{c.name}</span>
            <span className="st2-hint">
              {c.itemCount} {t.foods}, {count(c.kcal)} {t.cal}
            </span>
            <span className="st2-hint st2-combo-items">{c.items.join(', ')}</span>
          </div>
          <div className="st2-combo-actions">
            <button type="button" className="st2-chip is-on" disabled={busy} onClick={() => onAdd(c)}>
              {t.addCombo}
            </button>
            <button
              type="button"
              className="st2-meal-copy"
              disabled={busy}
              aria-label={`${t.remove} ${c.name}`}
              onClick={() => onRemove(c)}
            >
              {t.remove}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}