import { useEffect, useState, type FormEvent } from 'react'
import { useStrings } from '../../i18n/useStrings'
import { addCombo, type Combo } from '../api/combosApi'
import { addFood, MEALS, type Meal } from '../api/foodLogApi'
import { useCombos } from '../hooks/useCombos'
import { useFood } from '../hooks/useFood'
import { useFoodLists } from '../hooks/useFoodLists'
import { useFoodSearch } from '../hooks/useFoodSearch'
import { ST_COMBOS } from '../strings/combos'
import { ST_CUSTOM } from '../strings/customFoods'
import { ST_TRACKER } from '../strings/tracker'
import { count, tenth } from '../utils/format'
import { scale } from '../utils/meals'
import { ComboList } from './ComboList'
import { FoodList } from './FoodList'
import { MyFoodsPanel } from './MyFoodsPanel'
import '../styles/setup.css'

// "Add food": recent foods, favorites, combos and My foods first, then
// search the USDA foods; pick an amount, portion and meal, see what it
// adds, then add it.

type Props = {
  date: string
  dayName: string
  initialMeal: Meal
  onAdded: () => void
  onDone: () => void
}

type ListTab = 'recent' | 'favorites' | 'combos' | 'mine'

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

export function AddFood({ date, dayName, initialMeal, onAdded, onDone }: Props) {
  const t = useStrings(ST_TRACKER)
  const c = useStrings(ST_COMBOS)
  const cf = useStrings(ST_CUSTOM)

  const [query, setQuery] = useState('')
  const [chip, setChip] = useState('all')
  const [listTab, setListTab] = useState<ListTab>('recent')
  const [selected, setSelected] = useState<number | null>(null)
  const [meal, setMeal] = useState<Meal>(initialMeal)
  const [portionId, setPortionId] = useState<number | null>(null)
  const [amountText, setAmountText] = useState('1')
  const [saving, setSaving] = useState(false)
  const [added, setAdded] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const search = useFoodSearch(query, chip === 'all' ? null : chip)
  const lists = useFoodLists()
  const combos = useCombos()
  const { food, error: foodError, toggleFavorite } = useFood(selected)

  useEffect(() => {
    if (food) {
      setPortionId((current) =>
        food.portions.some((p) => p.id === current) ? current : (food.portions[0]?.id ?? null),
      )
      setError(null)
    }
  }, [food])

  const portion = food?.portions.find((p) => p.id === portionId) ?? null
  const amount = parseAmount(amountText)
  const validAmount = amount !== null && amount >= 0.1 && amount <= 50
  const preview = food && portion && validAmount && amount !== null ? scale(food.per100g, portion.grams * amount) : null

  function pick(id: number) {
    setSelected(id)
    setPortionId(null)
    setAmountText('1')
    setAdded(null)
  }

  function closeFood() {
    setSelected(null)
    void lists.reload()
  }

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
      closeFood()
    } catch (err) {
      setError(err instanceof Error ? err.message : '')
    } finally {
      setSaving(false)
    }
  }

  async function addSavedCombo(combo: Combo) {
    setSaving(true)
    setError(null)
    try {
      await addCombo(combo.id, date, meal)
      setAdded(`${c.comboAdded}: ${combo.name} (${t.meals[meal]})`)
      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : '')
    } finally {
      setSaving(false)
    }
  }

  async function removeSavedCombo(combo: Combo) {
    setSaving(true)
    try {
      await combos.remove(combo.id)
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

  const searching = query.trim().length >= 2
  const tabLabels: Record<ListTab, string> = {
    recent: t.recent,
    favorites: t.favorites,
    combos: c.combos,
    mine: cf.myFoods,
  }

  // Meal picker shared by the food form, combos and My foods.
  const mealPicker = (
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
  )

  function listBody() {
    if (listTab === 'mine') {
      return (
        <MyFoodsPanel
          date={date}
          meal={meal}
          mealPicker={mealPicker}
          onAdded={(message) => {
            setAdded(message)
            onAdded()
          }}
        />
      )
    }
    if (listTab === 'combos') {
      return (
        <>
          {mealPicker}
          {combos.error !== null ? (
            <p className="st2-error">{combos.error}</p>
          ) : (
            <ComboList
              combos={combos.combos}
              busy={saving}
              onAdd={(combo) => void addSavedCombo(combo)}
              onRemove={(combo) => void removeSavedCombo(combo)}
            />
          )}
        </>
      )
    }
    const items = listTab === 'recent' ? lists.recent : lists.favorites
    if (lists.error !== null) return <p className="st2-error">{lists.error}</p>
    if (items.length === 0) return <p className="st2-hint">{listTab === 'recent' ? t.noRecent : t.noFavorites}</p>
    return <FoodList items={items} onPick={pick} />
  }

  return (
    <div className="st2-addfood">
      <header className="st2-setup-head">
        <h1 className="library-title st2-title">{t.addTitle}</h1>
        <p className="st2-hint">
          {t.addTo} {t.meals[meal].toLowerCase()}, {dayName}
        </p>
      </header>

      {added !== null && (
        <p className="st2-added" role="status">
          {added}
        </p>
      )}
      {error !== null && selected === null && (
        <p className="st2-error" role="alert">
          {error}
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

          {searching ? (
            <>
              <div className="st2-chips" role="group" aria-label={t.searchLabel}>
                {CHIPS.map((chipKey) => (
                  <button
                    key={chipKey}
                    type="button"
                    className={`st2-chip${chip === chipKey ? ' is-on' : ''}`}
                    aria-pressed={chip === chipKey}
                    onClick={() => setChip(chipKey)}
                  >
                    {t.categories[chipKey]}
                  </button>
                ))}
              </div>

              {search.loading && search.results.length === 0 ? (
                <p className="st2-hint">{t.searching}</p>
              ) : search.error !== null ? (
                <p className="st2-error">{search.error}</p>
              ) : search.results.length === 0 ? (
                <p className="st2-hint">{t.noResults}</p>
              ) : (
                <FoodList items={search.results} onPick={pick} />
              )}
            </>
          ) : (
            <>
              <p className="st2-hint">{t.searchHint}</p>
              <div className="st2-tabs st2-list-tabs" role="group">
                {(['recent', 'favorites', 'combos', 'mine'] as ListTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`st2-tab${listTab === tab ? ' is-on' : ''}`}
                    aria-pressed={listTab === tab}
                    onClick={() => setListTab(tab)}
                  >
                    {tabLabels[tab]}
                  </button>
                ))}
              </div>
              {listBody()}
            </>
          )}
          <p className="st2-plan-source">{t.source}</p>
        </>
      ) : !food ? (
        <p className="st2-hint">{foodError ?? t.loadingFood}</p>
      ) : (
        <form className="st2-setup" onSubmit={submit} noValidate>
          <button type="button" className="st2-guide st2-back" onClick={closeFood}>
            ‹ {t.back}
          </button>
          <div className="st2-food-top">
            <h2 className="st2-food-name">{food.name}</h2>
            <button
              type="button"
              className={`st2-star${food.isFavorite ? ' is-on' : ''}`}
              aria-pressed={food.isFavorite}
              onClick={() => void toggleFavorite()}
            >
              {food.isFavorite ? t.favoriteOn : t.favoriteOff}
            </button>
          </div>

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

          {mealPicker}

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