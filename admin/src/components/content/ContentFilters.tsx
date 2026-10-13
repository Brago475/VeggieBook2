import type { ContentKind } from '../../types/content'
import type { ContentFilterState, ContentSort } from './contentItems'

// Recipes and Secrets tabs, then the subject picker, search and sort.

type Option = { value: string; label: string }

type Props = {
  value: ContentFilterState
  onChange: (next: ContentFilterState) => void
  counts: Record<ContentKind, number>
  subjects: Option[]
}

const sorts: { value: ContentSort; label: string }[] = [
  { value: 'code', label: 'App order' },
  { value: 'az', label: 'A to Z' },
  { value: 'kept', label: 'Most kept' },
  { value: 'out', label: 'Most taken out' },
]

export function ContentFilters({ value, onChange, counts, subjects }: Props) {
  const recipes = value.kind === 'recipe'

  function setKind(kind: ContentKind) {
    if (kind !== value.kind) onChange({ ...value, kind, subject: '' })
  }

  return (
    <div className="ct-filters">
      <div className="ct-tabs" role="tablist" aria-label="Content type">
        <button
          type="button"
          role="tab"
          aria-selected={recipes}
          className={recipes ? 'ct-tab is-on' : 'ct-tab'}
          onClick={() => setKind('recipe')}
        >
          Recipes <span>{counts.recipe.toLocaleString()}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!recipes}
          className={!recipes ? 'ct-tab is-on' : 'ct-tab'}
          onClick={() => setKind('secret')}
        >
          Secrets <span>{counts.secret.toLocaleString()}</span>
        </button>
      </div>

      <div className="ct-row">
        <label className="ct-field">
          {recipes ? 'Vegetable' : 'Category'}
          <select value={value.subject} onChange={(e) => onChange({ ...value, subject: e.target.value })}>
            <option value="">{recipes ? 'All vegetables' : 'All categories'}</option>
            {subjects.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="ct-field is-wide">
          Search
          <input
            type="search"
            placeholder={recipes ? 'Search by title or code...' : 'Search by headline or number...'}
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
          />
        </label>

        <label className="ct-field">
          Sort
          <select value={value.sort} onChange={(e) => onChange({ ...value, sort: e.target.value as ContentSort })}>
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}