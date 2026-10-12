import { AllDataIcon } from '../alldata/AllDataIcons'
import type { BookKind, BooksResponse } from '../../types/books'

// The filters under the study switch:
//
//   Tabs      All, VeggieBooks, Secrets Books, with how many of each
//   Search    by research ID
//   Picker    one vegetable or Secrets category, with how many books
//   Sort      newest or oldest first
//
// Every choice applies on the page straight away; nothing loads again
// except a change of study (StudyView, above this).

export type KindFilter = 'all' | BookKind
export type SortOrder = 'newest' | 'oldest'

export type BookFilters = {
  kind: KindFilter
  search: string
  subject: string // "veggie:BROCCOLI", "secrets:3", or '' for any
  sort: SortOrder
}

export const noBookFilters: BookFilters = { kind: 'all', search: '', subject: '', sort: 'newest' }

type Props = {
  data: BooksResponse
  value: BookFilters
  onChange: (next: BookFilters) => void
}

export function BooksFilters({ data, value, onChange }: Props) {
  const set = (patch: Partial<BookFilters>) => onChange({ ...value, ...patch })

  const tabs: { id: KindFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: data.counts.all },
    { id: 'veggie', label: 'VeggieBooks', count: data.counts.veggie },
    { id: 'secrets', label: 'Secrets Books', count: data.counts.secrets },
  ]

  // Each vegetable and category that has books, with how many, A to Z.
  const subjects = new Map<string, { label: string; kind: BookKind; count: number }>()
  for (const b of data.books) {
    const id = `${b.kind}:${b.subjectCode ?? ''}`
    const entry = subjects.get(id)
    if (entry) entry.count += 1
    else subjects.set(id, { label: b.subject, kind: b.kind, count: 1 })
  }
  const options = [...subjects.entries()]
    .filter(([, s]) => value.kind === 'all' || s.kind === value.kind)
    .sort((a, b) => a[1].label.localeCompare(b[1].label))

  return (
    <div className="bk-filters">
      <div className="bk-tabs" role="tablist" aria-label="Book type">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={value.kind === t.id}
            className={value.kind === t.id ? 'bk-tab is-on' : 'bk-tab'}
            onClick={() => {
              // A vegetable or category of the other kind no longer fits.
              const keep = t.id === 'all' || value.subject.startsWith(`${t.id}:`)
              set({ kind: t.id, subject: keep ? value.subject : '' })
            }}
          >
            {t.label} <span>{t.count.toLocaleString()}</span>
          </button>
        ))}
      </div>

      <div className="bk-filter-row">
        <label className="bk-search">
          <AllDataIcon name="search" size={16} />
          <input
            type="search"
            placeholder="Search by research ID..."
            aria-label="Search by research ID"
            value={value.search}
            onChange={(e) => set({ search: e.target.value })}
          />
        </label>

        <label className="bk-select">
          <span>Vegetable or category</span>
          <select value={value.subject} onChange={(e) => set({ subject: e.target.value })}>
            <option value="">Any</option>
            {options.map(([id, s]) => (
              <option key={id} value={id}>
                {s.label}
                {value.kind === 'all' ? (s.kind === 'secrets' ? ' (Secrets)' : '') : ''} ({s.count})
              </option>
            ))}
          </select>
        </label>

        <label className="bk-select">
          <span>Sort</span>
          <select value={value.sort} onChange={(e) => set({ sort: e.target.value as SortOrder })}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>
    </div>
  )
}