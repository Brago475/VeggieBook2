import type { ReactNode } from 'react'
import type { BookTypeFilter } from '../../types/allData'
import type { ResearchFilters as Filters, ResearchOptions } from '../../types/research'
import { ResearchFilters } from '../research/ResearchFilters'

// Search, book type, the shared research filters (dates, age range,
// vegetable), and the download buttons, all in one line that sits in the
// top bar and wraps when it doesn't fit. Search and book type work on the
// loaded rows; the others reload the data.

type Props = {
  search: string
  onSearch: (value: string) => void
  searchHint: string
  bookType: BookTypeFilter
  onBookType: (value: BookTypeFilter) => void
  filters: Filters
  options: ResearchOptions | null
  onFilters: (next: Filters) => void
  actions: ReactNode
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
  actions,
}: Props) {
  return (
    <div className="ad-toolbar">
      <label className="ad-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
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

      <div className="ad-toolbar-actions">{actions}</div>
    </div>
  )
}