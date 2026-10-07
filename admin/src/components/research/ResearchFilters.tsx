import type { ResearchFilters as Filters, ResearchOptions, SheetName } from '../../types/research'
import { hasFilters, noFilters } from '../../utils/researchQuery'

// The filters above the sheet: date range, age range, and vegetable.
// Participants only uses age, so the others are turned off for it.

type Props = {
  sheet: SheetName
  filters: Filters
  options: ResearchOptions | null
  onChange: (next: Filters) => void
}

export function ResearchFilters({ sheet, filters, options, onChange }: Props) {
  const bookFilters = sheet === 'responses'

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="filters">
      <label className="filter">
        <span className="filter-label">From</span>
        <input
          type="date"
          value={filters.from}
          disabled={!bookFilters}
          onChange={(e) => set('from', e.target.value)}
        />
      </label>

      <label className="filter">
        <span className="filter-label">To</span>
        <input
          type="date"
          value={filters.to}
          disabled={!bookFilters}
          onChange={(e) => set('to', e.target.value)}
        />
      </label>

      <label className="filter">
        <span className="filter-label">Age range</span>
        <select value={filters.age} onChange={(e) => set('age', e.target.value)}>
          <option value="">All</option>
          {options?.ageRanges.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>

      <label className="filter">
        <span className="filter-label">Vegetable</span>
        <select
          value={filters.vegetable}
          disabled={!bookFilters}
          onChange={(e) => set('vegetable', e.target.value)}
        >
          <option value="">All</option>
          {options?.vegetables.map((v) => (
            <option key={v.code} value={v.code}>
              {v.name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="button-secondary filter-reset"
        onClick={() => onChange(noFilters)}
        disabled={!hasFilters(filters)}
      >
        Clear filters
      </button>
    </div>
  )
}