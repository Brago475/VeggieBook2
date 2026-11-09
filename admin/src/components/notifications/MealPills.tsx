import type { MealKey, PlaylistMeal } from '../../types/playlists'

// Breakfast, Lunch, Dinner, Snack as small pills with how many items each
// has. A meal with nothing for the vegetable is disabled.

type Props = {
  meals: PlaylistMeal[]
  value: MealKey | ''
  onChange: (meal: MealKey) => void
  countFor: (meal: MealKey) => { tips: number; recipes: number }
}

export function MealPills({ meals, value, onChange, countFor }: Props) {
  return (
    <div className="ps-meals" role="radiogroup" aria-label="Meal">
      {meals.map((m) => {
        const c = countFor(m.key)
        const total = c.tips + c.recipes
        const active = value === m.key
        return (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={total === 0 && !active}
            className={active ? 'ps-meal is-active' : 'ps-meal'}
            onClick={() => onChange(m.key)}
          >
            {m.en}
            <span>{total}</span>
          </button>
        )
      })}
    </div>
  )
}