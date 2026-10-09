import type { BookTypeFilter } from '../../types/allData'
import type { ResearchFilters as Filters, ResearchOptions } from '../../types/research'
import { ResearchFilters } from '../research/ResearchFilters'
import { AllDataIcon } from './AllDataIcons'

// The filter row under the page title: search, book type, the shared
// research filters (dates, age range, vegetable), and Clear filters.
// Search and book type work on the loaded rows; the others reload the
// data. Clear filters resets all of them at once.

type Props = {
  search: string
  onSearch: (value: string) => void
  searchHint: string
  bookType: BookTypeFilter
  onBookType: (value: BookTypeFilter) => void
  filters: Filters
  options: ResearchOptions | null
  onFilters: (next: Filters) => void
  onClear: () => void
  canClear: boolean
}

export function AllDataToolbar({
  search,
  onSearch,
  searchHint,
  bookType,
  onBookType,
  filters,
  options,
  onFilters,
  onClear,
  canClear,
}: Props) {
  return (
    <div className="ad-toolbar">
      <label className="ad-search">
        <AllDataIcon name="search" size={16} />
        <input
          type="search"
          aria-label={searchHint}
          placeholder={searchHint}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </label>

      <label className="ad-select">
        <span>Book type</span>
        <select value={bookType} onChange={(e) => onBookType(e.target.value as BookTypeFilter)}>
          <option value="">All</option>
          <option value="VeggieBook">VeggieBooks</option>
          <option value="Secrets Book">Secrets Books</option>
        </select>
      </label>

      <ResearchFilters sheet="responses" filters={filters} options={options} onChange={onFilters} />

      <button type="button" className="ad-clear" onClick={onClear} disabled={!canClear}>
        <AllDataIcon name="filter" size={16} />
        Clear filters
      </button>
    </div>
  )
}