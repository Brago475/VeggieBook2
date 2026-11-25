import { useState, type FormEvent, type ReactNode } from 'react'
import { useStrings } from '../../i18n/useStrings'
import {
  addCustomFood,
  createCustomFood,
  updateCustomFood,
  type CustomFood,
} from '../api/customFoodsApi'
import type { Meal } from '../api/foodLogApi'
import { useCustomFoods } from '../hooks/useCustomFoods'
import { ST_CUSTOM } from '../strings/customFoods'
import { ST_TRACKER } from '../strings/tracker'
import { count, tenth } from '../utils/format'
import { CustomFoodForm } from './CustomFoodForm'

// The My foods tab in Add food: list, create, edit, remove, and add a
// custom food to a meal.

type Props = {
  date: string
  meal: Meal
  mealPicker: ReactNode
  onAdded: (message: string) => void
}

type Mode = { kind: 'list' } | { kind: 'create' } | { kind: 'edit'; food: CustomFood } | { kind: 'add'; food: CustomFood }

export function MyFoodsPanel({ date, meal, mealPicker, onAdded }: Props) {
  const t = useStrings(ST_CUSTOM)
  const tr = useStrings(ST_TRACKER)
  const mine = useCustomFoods()
  const [mode, setMode] = useState<Mode>({ kind: 'list' })
  const [amountText, setAmountText] = useState('1')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (mode.kind === 'create' || mode.kind === 'edit') {
    const editing = mode.kind === 'edit' ? mode.food : null
    return (
      <CustomFoodForm
        initial={editing}
        onCancel={() => setMode({ kind: 'list' })}
        onSave={async (input) => {
          if (editing) await updateCustomFood(editing.id, input)
          else await createCustomFood(input)
          await mine.reload()
          setMode({ kind: 'list' })
        }}
      />
    )
  }

  if (mode.kind === 'add') {
    const food = mode.food
    const amount = Number(amountText.trim().replace(',', '.'))
    const valid = amountText.trim() !== '' && Number.isFinite(amount) && amount >= 0.1 && amount <= 50

    async function submit(e: FormEvent) {
      e.preventDefault()
      if (!valid) return setError(tr.errAmount)
      setBusy(true)
      setError(null)
      try {
        await addCustomFood(date, food.id, amount, meal)
        onAdded(`${tr.added}: ${food.name}, ${tenth(amount)} ${food.serving} (${tr.meals[meal]})`)
        setMode({ kind: 'list' })
      } catch (err) {
        setError(err instanceof Error ? err.message : '')
      } finally {
        setBusy(false)
      }
    }

    return (
      <form className="st2-setup" onSubmit={submit} noValidate>
        <button type="button" className="st2-guide st2-back" onClick={() => setMode({ kind: 'list' })}>
          ‹ {tr.back}
        </button>
        <h2 className="st2-food-name">{food.name}</h2>
        <div className="st2-field st2-field-small">
          <label className="st2-label" htmlFor="st2-cf-amount">
            {t.servings} ({food.serving})
          </label>
          <input
            id="st2-cf-amount"
            className="st2-input"
            inputMode="decimal"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            aria-invalid={!valid}
          />
        </div>
        {mealPicker}
        {valid && (
          <dl className="st2-summary">
            <div className="st2-summary-row">
              <dt>{tr.calories}</dt>
              <dd>{count(food.kcal * amount)}</dd>
            </div>
            <div className="st2-summary-row">
              <dt>{tr.protein}</dt>
              <dd>
                {tenth(food.proteinG * amount)} {tr.grams}
              </dd>
            </div>
            <div className="st2-summary-row">
              <dt>{tr.sodium}</dt>
              <dd>{count(food.sodiumMg * amount)} mg</dd>
            </div>
          </dl>
        )}
        {error !== null && (
          <p className="st2-error" role="alert">
            {error}
          </p>
        )}
        <div className="st2-form-actions">
          <button type="submit" className="st2-start" disabled={busy}>
            {busy ? tr.adding : `${tr.addTo} ${tr.meals[meal].toLowerCase()}`}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="st2-plan-section">
      <button type="button" className="st2-secondary" onClick={() => setMode({ kind: 'create' })}>
        {t.create}
      </button>
      {mine.error !== null && <p className="st2-error">{mine.error}</p>}
      {error !== null && <p className="st2-error">{error}</p>}
      {mine.foods.length === 0 ? (
        <p className="st2-hint">{t.noFoods}</p>
      ) : (
        <ul className="st2-results">
          {mine.foods.map((food) => (
            <li key={food.id} className="st2-combo">
              <div className="st2-combo-text">
                <span className="st2-result-name">{food.name}</span>
                <span className="st2-hint">
                  1 {food.serving}, {count(food.kcal)} {t.cal}
                </span>
              </div>
              <div className="st2-combo-actions">
                <button
                  type="button"
                  className="st2-chip is-on"
                  onClick={() => {
                    setAmountText('1')
                    setError(null)
                    setMode({ kind: 'add', food })
                  }}
                >
                  {t.add}
                </button>
                <button type="button" className="st2-meal-copy" onClick={() => setMode({ kind: 'edit', food })}>
                  {t.edit}
                </button>
                <button
                  type="button"
                  className="st2-meal-copy"
                  onClick={() => {
                    void mine.remove(food.id).catch((err) => setError(err instanceof Error ? err.message : ''))
                  }}
                >
                  {t.remove}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}