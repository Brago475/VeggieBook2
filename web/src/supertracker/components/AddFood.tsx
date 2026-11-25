import { useEffect, useState, type FormEvent } from 'react'
import { useStrings } from '../../i18n/useStrings'
import { addFood, MEALS, type Meal } from '../api/foodLogApi'
import { useFood } from '../hooks/useFood'
import { useFoodSearch } from '../hooks/useFoodSearch'
import { ST_TRACKER } from '../strings/tracker'
import { count, tenth } from '../utils/format'
import { scale } from '../utils/meals'
import '../styles/setup.css'

// "Add food": search the USDA foods, pick an amount, portion and meal, see
// what it adds, then add it. Matches the "Add food" mockup.

type Props = {
  date: string
  initialMeal: Meal
  onAdded: () => void
  onDone: () => void
}

const CHIPS = [
  'all',
  'vegetables',
  'fruits',
  'dairy',
  'protein',
  'breads_cereals',
  'pasta_rice',
  'mixed_meals',
  'snacks',
  'beverages',
  'sweets',
  'fast_foods',
  'additions',
]

function parseAmount(text: string): number | null {
  const n = Number(text.trim().replace(',', '.'))
  return text.trim() !== '' && Number.isFinite(n) ? n : null
}

export function AddFood({ date, initialMeal, onAdded, onDone }: Props) {
  const t = useStrings(ST_TRACKER)

  const [query, setQuery] = useState('')
  const [chip, setChip] = useState('all')
  const [selected, setSelected] = useState<number | null>(null)
  const [meal, setMeal] = useState<Meal>(initialMeal)
  const [portionId, setPortionId] = useState<number | null>(null)
  const [amountText, setAmountText] = useState('1')
  const [saving, setSaving] = useState(false)
  const [added, setAdded] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const search = useFoodSearch(query, chip === 'all' ? null : chip)
  const { food, error: foodError } = useFood(selected)

  useEffect(() => {
    if (food) {
      setPortionId(food.portions[0]?.id ?? null)
      setAmountText('1')
      setError(null)
    }
  }, [food])

  const portion = food?.portions.find((p) => p.id === portionId) ?? null
  const amount = parseAmount(amountText)
  const validAmount = amount !== null && amount >= 0.1 && amount <= 50
  const preview = food && portion && validAmount && amount !== null ? scale(food.per100g, portion.grams * amount) : null

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!food || !portion) return
    if (!validAmount || amount === null) {
      setError(t.errAmount)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await addFood(date, { foodId: food.id, portionId: portion.id, quantity: amount, meal })
      setAdded(`${t.added}: ${food.name}, ${tenth(amount)} ${portion.description} (${t.meals[meal]})`)
      onAdded()
      setSelected(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '')
    } finally {
      setSaving(false)
    }
  }

  const previewRows: [string, string][] = preview
    ? ([
        [t.calories, count(preview.kcal)],
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
        <h1 className="library-title st2-title">{t.addTitle}</h1>
        <p className="st2-hint">
          {t.addTo} {t.meals[meal].toLowerCase()}
        </p>
      </header>

      {added !== null && (
        <p className="st2-added" role="status">
          {added}
        </p>
      )}

      {selected === null ? (
        <>
          <div className="st2-field">
            <label className="st2-label" htmlFor="st2-search">
              {t.searchLabel}
            </label>
            <input
              id="st2-search"
              className="st2-input"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="st2-chips" role="group" aria-label={t.searchLabel}>
            {CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                className={`st2-chip${chip === c ? ' is-on' : ''}`}
                aria-pressed={chip === c}
                onClick={() => setChip(c)}
              >
                {t.categories[c]}
              </button>
            ))}
          </div>

          {query.trim().length < 2 ? (
            <p className="st2-hint">{t.searchHint}</p>
          ) : search.loading && search.results.length === 0 ? (
            <p className="st2-hint">{t.searching}</p>
          ) : search.error !== null ? (
            <p className="st2-error">{search.error}</p>
          ) : search.results.length === 0 ? (
            <p className="st2-hint">{t.noResults}</p>
          ) : (
            <ul className="st2-results">
              {search.results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="st2-result"
                    onClick={() => {
                      setSelected(r.id)
                      setAdded(null)
                    }}
                  >
                    <span className="st2-result-name">{r.name}</span>
                    <span className="st2-hint">
                      {[
                        r.category ? t.categories[r.category] : null,
                        r.portion && r.kcal !== null ? `1 ${r.portion}, ${count(r.kcal)} ${t.cal}` : null,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="st2-plan-source">{t.source}</p>
        </>
      ) : !food ? (
        <p className="st2-hint">{foodError ?? t.loadingFood}</p>
      ) : (
        <form className="st2-setup" onSubmit={submit} noValidate>
          <button type="button" className="st2-guide st2-back" onClick={() => setSelected(null)}>
            ‹ {t.back}
          </button>
          <h2 className="st2-food-name">{food.name}</h2>

          <div className="st2-row">
            <div className="st2-field st2-field-small">
              <label className="st2-label" htmlFor="st2-amount">
                {t.amount}
              </label>
              <input
                id="st2-amount"
                className="st2-input"
                inputMode="decimal"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                aria-invalid={!validAmount}
              />
            </div>
            <div className="st2-field">
              <label className="st2-label" htmlFor="st2-portion">
                {t.portion}
              </label>
              <select
                id="st2-portion"
                className="st2-input"
                value={portionId ?? ''}
                onChange={(e) => setPortionId(Number(e.target.value))}
              >
                {food.portions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.description} ({tenth(p.grams)} g)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="st2-field">
            <span className="st2-label">{t.meal}</span>
            <div className="st2-amounts" role="group" aria-label={t.meal}>
              {MEALS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`st2-pill${meal === m ? ' is-on' : ''}`}
                  aria-pressed={meal === m}
                  onClick={() => setMeal(m)}
                >
                  {t.meals[m]}
                </button>
              ))}
            </div>
          </div>

          {previewRows.length > 0 && (
            <dl className="st2-summary">
              {previewRows.map(([label, value]) => (
                <div key={label} className="st2-summary-row">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {error !== null && (
            <p className="st2-error" role="alert">
              {error}
            </p>
          )}

          <div className="st2-form-actions">
            <button type="submit" className="st2-start" disabled={saving || !portion}>
              {saving ? t.adding : `${t.addTo} ${t.meals[meal].toLowerCase()}`}
            </button>
          </div>
        </form>
      )}

      <div className="st2-form-actions">
        <button type="button" className="st2-guide" onClick={onDone} disabled={saving}>
          {t.done}
        </button>
      </div>
    </div>
  )
}