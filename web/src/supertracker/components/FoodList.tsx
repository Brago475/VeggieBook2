import { useStrings } from '../../i18n/useStrings'
import type { FoodHit } from '../api/foodLogApi'
import { ST_TRACKER } from '../strings/tracker'
import { count } from '../utils/format'

// A tappable list of foods: search results, recent foods or favorites.

type Props = {
  items: FoodHit[]
  onPick: (id: number) => void
}

export function FoodList({ items, onPick }: Props) {
  const t = useStrings(ST_TRACKER)

  return (
    <ul className="st2-results">
      {items.map((r) => (
        <li key={r.id}>
          <button type="button" className="st2-result" onClick={() => onPick(r.id)}>
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
  )
}