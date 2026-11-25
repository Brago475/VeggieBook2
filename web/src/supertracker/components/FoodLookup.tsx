import { useState } from 'react'
import { useStrings } from '../../i18n/useStrings'
import { addFood, type Meal } from '../api/foodLogApi'
import { useFood } from '../hooks/useFood'
import { usePortion, type PortionState } from '../hooks/usePortion'
import { ST_LOOKUP } from '../strings/lookup'
import { ST_TRACKER } from '../strings/tracker'
import { tenth } from '../utils/format'
import { mealNow, scale } from '../utils/meals'
import { FoodPicker, NEW_SEARCH, type FoodSearch } from './FoodPicker'
import { MealPills } from './MealPills'
import { NutritionTable } from './NutritionTable'
import { PortionFields } from './PortionFields'

// Food-A-Pedia: look up any USDA food for any portion, compare two foods
// side by side, and add the food to a meal on the day being viewed.

type Props = {
  date: string
  dayName: string
  onAdded: () => void
}

type Picking = 'first' | 'second' | null

function columnTitle(state: PortionState): string {
  return state.portion && state.amount !== null && state.valid
    ? `${tenth(state.amount)} ${state.portion.description}`
    : ''
}

export function FoodLookup({ date, dayName, onAdded }: Props) {
  const l = useStrings(ST_LOOKUP)
  const t = useStrings(ST_TRACKER)

  const [firstId, setFirstId] = useState<number | null>(null)
  const [secondId, setSecondId] = useState<number | null>(null)
  const [picking, setPicking] = useState<Picking>('first')
  const [firstSearch, setFirstSearch] = useState<FoodSearch>(NEW_SEARCH)
  const [secondSearch, setSecondSearch] = useState<FoodSearch>(NEW_SEARCH)
  const [meal, setMeal] = useState<Meal>(() => mealNow())
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const first = useFood(firstId)
  const second = useFood(secondId)
  const a = usePortion(first.food)
  const b = usePortion(second.food)

  const firstAmounts = first.food && a.grams !== null ? scale(first.food.per100g, a.grams) : null
  const secondAmounts = second.food && b.grams !== null ? scale(second.food.per100g, b.grams) : null

  async function addToMeal() {
    const food = first.food
    if (!food || !a.portion || !a.valid || a.amount === null) {
      setError(t.errAmount)
      return
    }
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await addFood(date, { foodId: food.id, portionId: a.portion.id, quantity: a.amount, meal })
      setNotice(`${t.added}: ${food.name}, ${tenth(a.amount)} ${a.portion.description} (${t.meals[meal]}, ${dayName})`)
      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : '')
    } finally {
      setBusy(false)
    }
  }

  function body() {
    if (picking === 'first') {
      return (
        <FoodPicker
          id="st2-lookup-first"
          label={t.searchLabel}
          search={firstSearch}
          onSearch={setFirstSearch}
          onPick={(id) => {
            setFirstId(id)
            setSecondId(null)
            setPicking(null)
            setNotice(null)
            setError(null)
          }}
        />
      )
    }

    if (picking === 'second') {
      return (
        <>
          <button type="button" className="st2-guide st2-back" onClick={() => setPicking(null)}>
            ‹ {l.cancel}
          </button>
          <FoodPicker
            id="st2-lookup-second"
            label={`${l.compareWith} ${first.food?.name ?? ''}`}
            search={secondSearch}
            onSearch={setSecondSearch}
            onPick={(id) => {
              setSecondId(id)
              setPicking(null)
            }}
          />
        </>
      )
    }

    if (!first.food) return <p className="st2-hint">{first.error ?? t.loadingFood}</p>

    const newSearch = (
      <button type="button" className="st2-guide st2-back" onClick={() => setPicking('first')}>
        ‹ {l.newSearch}
      </button>
    )

    if (secondId === null) {
      return (
        <div className="st2-setup">
          {newSearch}
          <div className="st2-food-top">
            <h2 className="st2-food-name">{first.food.name}</h2>
            <button
              type="button"
              className={`st2-star${first.food.isFavorite ? ' is-on' : ''}`}
              aria-pressed={first.food.isFavorite}
              onClick={() => void first.toggleFavorite()}
            >
              {first.food.isFavorite ? t.favoriteOn : t.favoriteOff}
            </button>
          </div>
          <PortionFields id="st2-lookup-a" food={first.food} state={a} />
          {!a.valid && <p className="st2-error">{t.errAmount}</p>}

          <h3 className="st2-plan-h2">{l.nutrition}</h3>
          <NutritionTable columns={[{ title: columnTitle(a), amounts: firstAmounts }]} />

          <div className="st2-form-actions">
            <button type="button" className="st2-secondary" onClick={() => setPicking('second')}>
              {l.compare}
            </button>
          </div>

          <h3 className="st2-plan-h2">{l.addTitle}</h3>
          <MealPills value={meal} onChange={(m) => m && setMeal(m)} />
          <div className="st2-form-actions">
            <button type="button" className="st2-start" disabled={busy || !a.valid} onClick={() => void addToMeal()}>
              {busy ? t.adding : `${t.addTo} ${t.meals[meal].toLowerCase()}`}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="st2-setup">
        {newSearch}
        <div className="st2-compare-foods">
          <div className="st2-compare-food">
            <h2 className="st2-food-name">{first.food.name}</h2>
            <PortionFields id="st2-lookup-a" food={first.food} state={a} />
          </div>
          <div className="st2-compare-food">
            {second.food ? (
              <>
                <h2 className="st2-food-name">{second.food.name}</h2>
                <PortionFields id="st2-lookup-b" food={second.food} state={b} />
              </>
            ) : (
              <p className="st2-hint">{second.error ?? t.loadingFood}</p>
            )}
          </div>
        </div>
        {(!a.valid || (second.food !== null && !b.valid)) && <p className="st2-error">{t.errAmount}</p>}

        <NutritionTable
          columns={[
            { title: first.food.name, amounts: firstAmounts },
            { title: second.food?.name ?? '', amounts: secondAmounts },
          ]}
        />

        <div className="st2-form-actions">
          <button type="button" className="st2-secondary" onClick={() => setPicking('second')}>
            {l.changeSecond}
          </button>
          <button type="button" className="st2-guide" onClick={() => setSecondId(null)}>
            {l.stopCompare}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="st2-addfood">
      <header className="st2-setup-head">
        <h1 className="library-title st2-title">{l.title}</h1>
        <p className="st2-hint">{l.intro}</p>
      </header>

      {notice !== null && (
        <p className="st2-added" role="status">
          {notice}
        </p>
      )}
      {error !== null && (
        <p className="st2-error" role="alert">
          {error}
        </p>
      )}

      {body()}
    </div>
  )
}