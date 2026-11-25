import { useState } from 'react'
import { useStrings } from '../../i18n/useStrings'
import { saveComboFromMeal } from '../api/combosApi'
import { copyMeal, MEALS, type Day, type DayEntry, type DayTotals, type Meal } from '../api/foodLogApi'
import type { Plan } from '../api/superTrackerApi'
import { ST_TRACKER } from '../strings/tracker'
import { addDays } from '../utils/dates'
import { count, servings, tenth } from '../utils/format'
import { mealNow } from '../utils/meals'
import { DayNav } from './DayNav'
import { GroupBar } from './GroupBar'
import { MealSection } from './MealSection'

// One day: calories left, food groups against My plan, daily limits, and
// the day's foods by meal. Tap a food to edit it. Matches the "Today"
// mockup.

type Props = {
  date: string
  plan: Plan
  day: Day | null
  error: string | null
  onDateChange: (date: string) => void
  onRetry: () => void
  onChanged: () => void
  onAddFood: (meal: Meal) => void
  onQuickVegetables: () => void
  onRemove: (id: number) => void
  onEdit: (entry: DayEntry) => void
}

const EMPTY: DayTotals = {
  kcal: 0,
  vegetables: 0,
  fruits: 0,
  dairy: 0,
  wholeGrains: 0,
  healthyFats: 0,
  proteinG: 0,
  sodiumMg: 0,
  satFatG: 0,
  addedSugarG: 0,
  fiberG: 0,
  potassiumMg: 0,
  vitaminCMg: 0,
}

export function Today({
  date,
  plan,
  day,
  error,
  onDateChange,
  onRetry,
  onChanged,
  onAddFood,
  onQuickVegetables,
  onRemove,
  onEdit,
}: Props) {
  const t = useStrings(ST_TRACKER)
  const [copying, setCopying] = useState<Meal | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function copy(meal: Meal) {
    setCopying(meal)
    setNotice(null)
    try {
      const res = await copyMeal(date, addDays(date, -1), meal)
      if (res.copied === 0) setNotice(t.nothingToCopy)
      onChanged()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : '')
    } finally {
      setCopying(null)
    }
  }

  const totals = day?.totals ?? EMPTY
  const entries = day?.entries ?? []
  const left = plan.calories - totals.kcal
  const calPct = plan.calories > 0 ? Math.min(100, Math.round((totals.kcal / plan.calories) * 100)) : 0

  function servingRow(label: string, have: number, goal: number) {
    return (
      <GroupBar
        key={label}
        label={label}
        have={have}
        goal={goal}
        met={have >= goal}
        text={`${tenth(have)} ${t.of} ${servings(goal)} ${t.servings}${have >= goal ? `, ${t.met}` : ''}`}
      />
    )
  }

  const s = plan.servings
  const quick = entries.filter((e) => e.meal === null)

  return (
    <div className="st2-today">
      <DayNav
        date={date}
        onChange={(d) => {
          setNotice(null)
          onDateChange(d)
        }}
      />

      {error !== null ? (
        <section className="st2-panel">
          <p className="st2-error">{error || t.loadFailed}</p>
          <button type="button" className="st2-guide" onClick={onRetry}>
            {t.retry}
          </button>
        </section>
      ) : (
        <>
          <section className="st2-cal">
            <p className="st2-cal-big">
              {count(Math.abs(left))} <span>{left >= 0 ? t.caloriesLeft : t.caloriesOver}</span>
            </p>
            <div className="st2-bar" aria-hidden="true">
              <span style={{ width: `${calPct}%` }} />
            </div>
            <p className="st2-hint">
              {count(totals.kcal)} {t.of} {count(plan.calories)} {t.eaten}
            </p>
          </section>

          <div className="st2-today-actions">
            <button type="button" className="st2-start" onClick={() => onAddFood(mealNow())}>
              {t.addFood}
            </button>
            <button type="button" className="st2-secondary" onClick={onQuickVegetables}>
              {t.quickVeg}
            </button>
          </div>

          <section className="st2-plan-section">
            <h2 className="st2-plan-h2">{t.groupsTitle}</h2>
            <ul className="st2-grows">
              {servingRow(t.vegetables, totals.vegetables, s.vegetables.min)}
              {servingRow(t.fruits, totals.fruits, s.fruits.min)}
              {servingRow(t.dairy, totals.dairy, s.dairy.min)}
              {servingRow(t.wholeGrains, totals.wholeGrains, s.wholeGrains.min)}
              <GroupBar
                label={t.protein}
                have={totals.proteinG}
                goal={plan.proteinGrams.min}
                met={totals.proteinG >= plan.proteinGrams.min}
                text={`${count(totals.proteinG)} ${t.of} ${plan.proteinGrams.min} ${t.grams}`}
              />
              {servingRow(t.healthyFats, totals.healthyFats, s.healthyFats.min)}
            </ul>
          </section>

          <section className="st2-plan-section">
            <h2 className="st2-plan-h2">{t.limitsTitle}</h2>
            <dl className="st2-summary">
              <div className={`st2-summary-row${totals.sodiumMg > plan.limits.sodiumMg ? ' is-over' : ''}`}>
                <dt>{t.sodium}</dt>
                <dd>
                  {count(totals.sodiumMg)} / {count(plan.limits.sodiumMg)} mg
                </dd>
              </div>
              <div className={`st2-summary-row${totals.satFatG > plan.limits.saturatedFatG ? ' is-over' : ''}`}>
                <dt>{t.satFat}</dt>
                <dd>
                  {tenth(totals.satFatG)} / {plan.limits.saturatedFatG} g
                </dd>
              </div>
              <div className="st2-summary-row">
                <dt>{t.addedSugars}</dt>
                <dd>{tenth(totals.addedSugarG)} g</dd>
              </div>
            </dl>
            <p className="st2-hint">{t.limitNote}</p>
          </section>

          {notice !== null && (
            <p className="st2-hint" role="status">
              {notice}
            </p>
          )}

          <div className="st2-meals">
            {MEALS.map((meal) => (
              <MealSection
                key={meal}
                title={t.meals[meal]}
                entries={entries.filter((e) => e.meal === meal)}
                onAdd={() => onAddFood(meal)}
                addLabel={`${t.addTo} ${t.meals[meal].toLowerCase()}`}
                onCopy={() => void copy(meal)}
                copying={copying === meal}
                onSaveCombo={async (name) => {
                  await saveComboFromMeal(date, meal, name)
                }}
                onRemove={onRemove}
                onEdit={onEdit}
              />
            ))}
            {quick.length > 0 && (
              <MealSection title={t.quickAdded} entries={quick} onRemove={onRemove} onEdit={onEdit} />
            )}
          </div>
        </>
      )}
    </div>
  )
}