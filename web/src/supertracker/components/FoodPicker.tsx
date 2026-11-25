import { useStrings } from '../../i18n/useStrings'
import { useFoodSearch } from '../hooks/useFoodSearch'
import { ST_TRACKER } from '../strings/tracker'
import { FoodList } from './FoodList'

// Search the USDA foods with category chips. The search text and chip are
// kept by the parent, so they are still there after looking at a food.

export type FoodSearch = { query: string; chip: string }

export const NEW_SEARCH: FoodSearch = { query: '', chip: 'all' }

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

type Props = {
  id: string
  label: string
  search: FoodSearch
  onSearch: (search: FoodSearch) => void
  onPick: (id: number) => void
}

export function FoodPicker({ id, label, search, onSearch, onPick }: Props) {
  const t = useStrings(ST_TRACKER)
  const found = useFoodSearch(search.query, search.chip === 'all' ? null : search.chip)
  const searching = search.query.trim().length >= 2

  return (
    <>
      <div className="st2-field">
        <label className="st2-label" htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          className="st2-input"
          type="search"
          autoComplete="off"
          value={search.query}
          onChange={(e) => onSearch({ ...search, query: e.target.value })}
          autoFocus
        />
      </div>

      {searching ? (
        <>
          <div className="st2-chips" role="group" aria-label={label}>
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className={`st2-chip${search.chip === chip ? ' is-on' : ''}`}
                aria-pressed={search.chip === chip}
                onClick={() => onSearch({ ...search, chip })}
              >
                {t.categories[chip]}
              </button>
            ))}
          </div>

          {found.loading && found.results.length === 0 ? (
            <p className="st2-hint">{t.searching}</p>
          ) : found.error !== null ? (
            <p className="st2-error">{found.error}</p>
          ) : found.results.length === 0 ? (
            <p className="st2-hint">{t.noResults}</p>
          ) : (
            <FoodList items={found.results} onPick={onPick} />
          )}
        </>
      ) : (
        <p className="st2-hint">{t.searchHint}</p>
      )}
      <p className="st2-plan-source">{t.source}</p>
    </>
  )
}