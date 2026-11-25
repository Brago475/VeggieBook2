import { useState, type FormEvent } from 'react'
import { useStrings } from '../../i18n/useStrings'
import { deleteEntry, editEntry, type Amounts, type DayEntry, type Meal } from '../api/foodLogApi'
import { useFood } from '../hooks/useFood'
import { ST_LOOKUP } from '../strings/lookup'
import { ST_TRACKER } from '../strings/tracker'
import { parseAmount, times } from '../utils/amounts'
import { count, tenth } from '../utils/format'
import { scale } from '../utils/meals'
import { MealPills } from './MealPills'
import '../styles/setup.css'

// Edit one logged food: amount, portion (USDA foods only) and meal, with a
// preview before saving. Limits match FoodLogController.EditEntry.

type Props = {
  entry: DayEntry
  onSaved: () => void
  onCancel: () => void
}

export function EditEntry({ entry, onSaved, onCancel }: Props) {
  const t = useStrings(ST_TRACKER)
  const l = useStrings(ST_LOOKUP)

  const isVegetable = entry.vegetableKey !== null
  const isUsda = entry.foodId !== null && !isVegetable
  const { food } = useFood(isUsda ? entry.foodId : null)

  const [amountText, setAmountText] = useState(String(entry.quantity))
  const [portionId, setPortionId] = useState<number | null>(null)
  const [meal, setMeal] = useState<Meal | null>(entry.meal)
  const [busy, setBusy] = useState<'save' | 'remove' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const min = isVegetable ? 0.25 : 0.1
  const max = isVegetable ? 10 : 50
  const amount = parseAmount(amountText)
  const valid = amount !== null && amount >= min && amount <= max
  const portion = food?.portions.find((p) => p.id === portionId) ?? null
  const otherPortions = food?.portions.filter((p) => p.description !== entry.portion) ?? []

  let preview: Amounts | null = null
  if (valid && amount !== null) {
    if (portion && food) preview = scale(food.per100g, portion.grams * amount)
    else if (entry.quantity > 0) preview = times(entry.amounts, amount / entry.quantity)
  }

  const amountLabel = isVegetable ? l.cups : isUsda ? t.amount : `${l.servings} (${entry.portion})`

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!valid || amount === null) {
      setError(isVegetable ? l.errAmountVeg : t.errAmount)
      return
    }
    if (meal === null && !isVegetable) {
      setError(l.errMeal)
      return
    }
    setBusy('save')
    setError(null)
    try {
      await editEntry(entry.id, { quantity: amount, portionId: portion ? portion.id : null, meal })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : '')
      setBusy(null)
    }
  }

  async function remove() {
    setBusy('remove')
    setError(null)
    try {
      await deleteEntry(entry.id)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : '')
      setBusy(null)
    }
  }

  const rows: [string, string][] = preview
    ? ([
        [t.calories, `${count(preview.kcal)} (${l.was} ${count(entry.amounts.kcal)})`],
        [t.vegetables, preview.vegetables >= 0.05 ? `${tenth(preview.vegetables)} ${t.servings}` : ''],
        [t.fruits, preview.fruits >= 0.05 ? `${tenth(preview.fruits)} ${t.servings}` : ''],
        [t.dairy, preview.dairy >= 0.05 ? `${tenth(preview.dairy)} ${t.servings}` : ''],
        [t.wholeGrains, preview.wholeGrains >= 0.05 ? `${tenth(preview.wholeGrains)} ${t.servings}` : ''],
        [t.protein, `${tenth(preview.proteinG)} ${t.grams}`],
        [t.sodium, `${count(preview.sodiumMg)} mg`],
        [t.satFat, `${tenth(preview.satFatG)} g`],
        [t.addedSugars, `${tenth(preview.addedSugarG)} g`],
      ] as [string, string][]).filter(([, v]) => v !== '')
    : []

  return (
    <div className="st2-addfood">
      <header className="st2-setup-head">
        <h1 className="library-title st2-title">{l.editTitle}</h1>
        <p className="st2-hint">{entry.name}</p>
      </header>

      <form className="st2-setup" onSubmit={save} noValidate>
        <div className="st2-row">
          <div className="st2-field st2-field-small">
            <label className="st2-label" htmlFor="st2-edit-amount">
              {amountLabel}
            </label>
            <input
              id="st2-edit-amount"
              className="st2-input"
              inputMode="decimal"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              aria-invalid={!valid}
              autoFocus
            />
          </div>
          {isUsda && food && (
            <div className="st2-field">
              <label className="st2-label" htmlFor="st2-edit-portion">
                {t.portion}
              </label>
              <select
                id="st2-edit-portion"
                className="st2-input"
                value={portionId ?? ''}
                onChange={(e) => setPortionId(e.target.value === '' ? null : Number(e.target.value))}
              >
                <option value="">
                  {entry.portion} ({l.current})
                </option>
                {otherPortions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.description} ({tenth(p.grams)} g)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <MealPills value={meal} onChange={setMeal} noneLabel={isVegetable ? l.noMeal : undefined} />

        {rows.length > 0 && (
          <>
            <h3 className="st2-plan-h2">{l.withChange}</h3>
            <dl className="st2-summary">
              {rows.map(([label, value]) => (
                <div key={label} className="st2-summary-row">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </>
        )}

        {error !== null && (
          <p className="st2-error" role="alert">
            {error}
          </p>
        )}

        <div className="st2-form-actions">
          <button type="submit" className="st2-start" disabled={busy !== null}>
            {busy === 'save' ? l.saving : l.save}
          </button>
          <button type="button" className="st2-guide" onClick={onCancel} disabled={busy !== null}>
            {l.cancel}
          </button>
        </div>
        <div className="st2-form-actions">
          <button type="button" className="st2-meal-copy" onClick={() => void remove()} disabled={busy !== null}>
            {busy === 'remove' ? l.removing : l.removeEntry}
          </button>
        </div>
      </form>
    </div>
  )
}