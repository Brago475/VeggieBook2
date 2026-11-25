import { useStrings } from '../../i18n/useStrings'
import type { Day } from '../api/foodLogApi'
import type { Plan } from '../api/superTrackerApi'
import { ST_TODAY } from '../strings/today'
import { count, tenth } from '../utils/format'
import { longDate } from '../utils/dates'
import { VegetableProgress } from './VegetableProgress'

// Today: vegetable progress, what was logged, and a nutrient estimate.

type Props = {
  date: string
  plan: Plan
  day: Day | null
  error: string | null
  onRetry: () => void
  onAdd: () => void
  onRemove: (id: number) => void
}

export function Today({ date, plan, day, error, onRetry, onAdd, onRemove }: Props) {
  const t = useStrings(ST_TODAY)

  if (error !== null) {
    return (
      <section className="st2-panel">
        <p className="st2-error">{error || t.loadFailed}</p>
        <button type="button" className="st2-guide" onClick={onRetry}>
          {t.retry}
        </button>
      </section>
    )
  }

  const totals = day?.totals
  const entries = day?.entries ?? []

  return (
    <div className="st2-today">
      <header>
        <h1 className="library-title st2-title">{t.today}</h1>
        <p className="st2-hint">{longDate(date, t.locale)}</p>
      </header>

      <VegetableProgress have={totals?.vegetables ?? 0} goal={plan.servings.vegetables.min} />

      <button type="button" className="st2-start" onClick={onAdd}>
        {t.addVegetables}
      </button>

      <section className="st2-plan-section">
        <h2 className="st2-plan-h2">{t.logged}</h2>
        {entries.length === 0 ? (
          <p className="st2-hint">{t.nothingYet}</p>
        ) : (
          <ul className="st2-entries">
            {entries.map((e) => (
              <li key={e.id} className="st2-entry">
                <div className="st2-entry-text">
                  <span className="st2-entry-name">{e.name}</span>
                  <span className="st2-hint">
                    {tenth(e.quantity)} {e.quantity === 1 ? t.cup : t.cups}, {tenth(e.vegetables)}{' '}
                    {t.servingsWord}, {count(e.kcal)} {t.calories.toLowerCase()}
                  </span>
                </div>
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
      </section>

      {totals && entries.length > 0 && (
        <section className="st2-plan-section">
          <h2 className="st2-plan-h2">{t.nutrientsTitle}</h2>
          <dl className="st2-summary">
            <div className="st2-summary-row">
              <dt>{t.calories}</dt>
              <dd>{count(totals.kcal)}</dd>
            </div>
            <div className="st2-summary-row">
              <dt>{t.fiber}</dt>
              <dd>{tenth(totals.fiberG)} g</dd>
            </div>
            <div className="st2-summary-row">
              <dt>{t.vitaminC}</dt>
              <dd>{count(totals.vitaminCMg)} mg</dd>
            </div>
            <div className="st2-summary-row">
              <dt>{t.potassium}</dt>
              <dd>{count(totals.potassiumMg)} mg</dd>
            </div>
          </dl>
        </section>
      )}

      <p className="st2-plan-source">{t.moreSoon}</p>
    </div>
  )
}