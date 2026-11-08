import type { MealKey, PlaylistMeal } from '../../types/playlists'
import { shortCount } from './playlistFormat'

// Breakfast, Lunch, Dinner, Snack as four large buttons, each with how many
// labeled recipes and tips it has. With allowNone, tapping the chosen meal
// again clears it.

type Props = {
  meals: PlaylistMeal[]
  value: MealKey | ''
  onChange: (meal: MealKey | '') => void
  countFor?: (meal: MealKey) => { tips: number; recipes: number }
  allowNone?: boolean
}

export function MealButtons({ meals, value, onChange, countFor, allowNone = false }: Props) {
  return (
    <div className="mb-row" role="radiogroup" aria-label="Meal">
      {meals.map((m) => {
        const c = countFor?.(m.key)
        const empty = c ? c.tips + c.recipes === 0 : false
        const active = value === m.key
        const className = ['mb-button', active ? 'is-active' : '', empty ? 'is-empty' : ''].filter(Boolean).join(' ')
        return (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={active}
            className={className}
            onClick={() => onChange(active && allowNone ? '' : m.key)}
          >
            <strong>{m.en}</strong>
            {c && <span>{shortCount(c.tips, c.recipes)}</span>}
          </button>
        )
      })}
    </div>
  )
}