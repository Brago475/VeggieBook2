import { useStrings } from '../../i18n/useStrings'
import { MEALS, type Meal } from '../api/foodLogApi'
import { ST_TRACKER } from '../strings/tracker'

// Meal choice. noneLabel adds a "no meal" choice, used for quick-added
// vegetables.

type Props = {
  value: Meal | null
  onChange: (meal: Meal | null) => void
  noneLabel?: string
}

export function MealPills({ value, onChange, noneLabel }: Props) {
  const t = useStrings(ST_TRACKER)
  const choices: [Meal | null, string][] = MEALS.map((m) => [m, t.meals[m]])
  if (noneLabel) choices.push([null, noneLabel])

  return (
    <div className="st2-field">
      <span className="st2-label">{t.meal}</span>
      <div className="st2-amounts" role="group" aria-label={t.meal}>
        {choices.map(([meal, label]) => (
          <button
            key={meal ?? 'none'}
            type="button"
            className={`st2-pill${value === meal ? ' is-on' : ''}`}
            aria-pressed={value === meal}
            onClick={() => onChange(meal)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}