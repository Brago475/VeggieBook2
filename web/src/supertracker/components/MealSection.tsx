import { useStrings } from '../../i18n/useStrings'
import type { DayEntry } from '../api/foodLogApi'
import { ST_TRACKER } from '../strings/tracker'
import { count, tenth } from '../utils/format'

// One meal on Today: its foods, calories, and an Add button.

type Props = {
  title: string
  entries: DayEntry[]
  onAdd?: () => void
  addLabel?: string
  onRemove: (id: number) => void
}

export function MealSection({ title, entries, onAdd, addLabel, onRemove }: Props) {
  const t = useStrings(ST_TRACKER)
  const kcal = entries.reduce((sum, e) => sum + e.amounts.kcal, 0)

  return (
    <section className="st2-meal">
      <header className="st2-meal-head">
        <h3 className="st2-meal-title">{title}</h3>
        <span className="st2-meal-kcal">
          {count(kcal)} {t.cal}
        </span>
      </header>

      {entries.length === 0 ? (
        <p className="st2-meal-empty">{t.nothing}</p>
      ) : (
        <ul className="st2-meal-list">
          {entries.map((e) => (
            <li key={e.id} className="st2-entry">
              <div className="st2-entry-text">
                <span className="st2-entry-name">{e.name}</span>
                <span className="st2-hint">
                  {tenth(e.quantity)} {e.portion}
                </span>
              </div>
              <span className="st2-entry-kcal">{count(e.amounts.kcal)}</span>
              <button
                type="button"
                className="st2-entry-remove"
                aria-label={`${t.remove} ${e.name}`}
                onClick={() => onRemove(e.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {onAdd && (
        <button type="button" className="st2-meal-add" onClick={onAdd}>
          + {addLabel}
        </button>
      )}
    </section>
  )
}