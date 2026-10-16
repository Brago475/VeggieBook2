import { useEffect, useMemo, useState } from 'react'
import { AllDataCards } from '../components/alldata/AllDataCards'
import type { AllDataCard } from '../components/alldata/AllDataCards'
import { AllDataIcon } from '../components/alldata/AllDataIcons'
import { AllDataToolbar } from '../components/alldata/AllDataToolbar'
import { BookPanel } from '../components/alldata/BookPanel'
import { BooksTable } from '../components/alldata/BooksTable'
import { ColumnToggles } from '../components/alldata/ColumnToggles'
import { DownloadMenu } from '../components/alldata/DownloadMenu'
import { ItemsTable } from '../components/alldata/ItemsTable'
import { Segmented } from '../components/alldata/Segmented'
import { StudyView } from '../components/alldata/StudyView'
import { TopbarActions, TopbarBelow } from '../components/layout/TopbarSlot'
import { AllDataSkeleton } from '../components/skeletons/AllDataSkeleton'
import { CardRowSkeleton } from '../components/skeletons/CardRowSkeleton'
import { useAllData } from '../hooks/useAllData'
import { useHeld } from '../hooks/useHeld'
import type { AllDataFile, AnswersView, BookTypeFilter, ColumnGroup, ItemStatusFilter } from '../types/allData'
import type { ResearchFilters, ResearchOptions, SheetRow } from '../types/research'
import { api } from '../utils/api'
import { bookColumns } from '../utils/allDataColumns'
import { bookKey, dateRange } from '../utils/allDataFormat'
import { hasFilters, noFilters } from '../utils/researchQuery'
import '../styles/alldata.css'
import '../styles/alldata-filters.css'
import '../styles/alldata-table.css'
import '../styles/alldata-colors.css'
import '../styles/alldata-preview.css'
import '../styles/alldata-topbar.css'
import '../styles/alldata-look.css'
import '../styles/alldata-responsive.css'

// All Data page: Books (one row per book) and Recipes and secrets (one row
// per item). Rows are keyed by research ID only. Downloads and Refresh sit
// in the top bar. initialStudy and initialSearch preset the view when
// opened from Studies or Participants.

const fileTabs: { id: AllDataFile; label: string; icon: 'book' | 'pot' }[] = [
  { id: 'books', label: 'Books', icon: 'book' },
  { id: 'items', label: 'Recipes and secrets', icon: 'pot' },
]

const allGroups: Record<ColumnGroup, boolean> = { person: true, book: true, answers: true, items: true }

function matchesSearch(row: SheetRow, text: string, withTitle: boolean) {
  if (!text) return true
  const needle = text.trim().toLowerCase()
  if (String(row.participant_id ?? '').toLowerCase().includes(needle)) return true
  return withTitle && String(row.item_title ?? '').toLowerCase().includes(needle)
}

type Props = {
  initialStudy?: number | null
  initialSearch?: string
}

export function AllData({ initialStudy = null, initialSearch = '' }: Props) {
  const [file, setFile] = useState<AllDataFile>('books')
  const [filters, setFilters] = useState<ResearchFilters>(noFilters)
  const [options, setOptions] = useState<ResearchOptions | null>(null)
  const [version, setVersion] = useState(0)
  const [search, setSearch] = useState(initialSearch)
  const [bookType, setBookType] = useState<BookTypeFilter>('')
  const [selected, setSelected] = useState<string | null>(null)
  const [panelClosed, setPanelClosed] = useState(false)
  const [answersView, setAnswersView] = useState<AnswersView>('chips')
  const [groups, setGroups] = useState<Record<ColumnGroup, boolean>>(allGroups)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [status, setStatus] = useState<ItemStatusFilter>('all')
  const [itemAnswers, setItemAnswers] = useState(false)
  const [study, setStudy] = useState<number | null>(initialStudy)

  const { books, items, questions, error, loading } = useAllData(filters, version, study)
  // Outline stays up briefly even on a fast load.
  const firstLoad = useHeld(!books && !error)
  const ready = !!books && !firstLoad

  useEffect(() => {
    let cancelled = false
    api<ResearchOptions>('/admin/research/options')
      .then((o) => {
        if (!cancelled) setOptions(o)
      })
      .catch(() => {
        // Filters still work; their option lists stay empty.
      })
    return () => {
      cancelled = true
    }
  }, [version])

  const bookRows = useMemo(
    () =>
      (books?.rows ?? []).filter(
        (r) => (!bookType || r.book_type === bookType) && matchesSearch(r, search, false),
      ),
    [books, bookType, search],
  )

  const itemRows = useMemo(
    () =>
      (items?.rows ?? []).filter(
        (r) => (!bookType || r.book_type === bookType) && matchesSearch(r, search, true),
      ),
    [items, bookType, search],
  )

  const itemsByBook = useMemo(() => {
    const map = new Map<string, SheetRow[]>()
    for (const r of items?.rows ?? []) {
      const key = bookKey(r)
      const list = map.get(key)
      if (list) list.push(r)
      else map.set(key, [r])
    }
    return map
  }, [items])

  const columns = useMemo(() => bookColumns(questions, answersView, groups), [questions, answersView, groups])
  // Side panel shows the clicked book, or the first row by default.
  const selectedBook = panelClosed
    ? null
    : (selected ? bookRows.find((r) => bookKey(r) === selected) : undefined) ?? bookRows[0] ?? null
  const selectedKey = selectedBook ? bookKey(selectedBook) : null

  function openBook(key: string) {
    setSelected(key)
    setPanelClosed(false)
  }

  function clearAll() {
    setFilters(noFilters)
    setSearch('')
    setBookType('')
    setStudy(null)
  }

  const veggieCount = bookRows.filter((r) => r.book_type === 'VeggieBook').length
  const secretsCount = bookRows.length - veggieCount
  const people = new Set(bookRows.map((r) => r.participant_id)).size

  const cards: AllDataCard[] =
    file === 'books'
      ? [
          { label: 'VeggieBooks', value: String(veggieCount), icon: 'book', tone: 'green' },
          { label: 'Secrets Books', value: String(secretsCount), icon: 'lock', tone: 'violet' },
          { label: 'Participants', value: String(people), icon: 'people', tone: 'blue' },
          { label: 'Dates covered', value: dateRange(bookRows), icon: 'calendar', tone: 'green' },
        ]
      : (() => {
          const kept = itemRows.filter((r) => r.status === 'Kept').length
          const out = itemRows.length - kept
          const pct = (n: number) => (itemRows.length ? `${Math.round((n / itemRows.length) * 100)}%` : '')
          const different = new Set(itemRows.map((r) => `${r.item_type}:${r.item_code ?? ''}:${r.item_title}`)).size
          return [
            { label: 'Recipes and secrets', value: String(itemRows.length), icon: 'list', note: `in ${bookRows.length} books`, tone: 'blue' },
            { label: 'Still kept', value: String(kept), icon: 'check', note: pct(kept), tone: 'green' },
            { label: 'Taken out later', value: String(out), icon: 'out', note: pct(out), tone: 'orange', warn: out > 0 },
            { label: 'Different recipes and secrets', value: String(different), icon: 'layers', tone: 'violet' },
          ]
        })()

  const tabCounts: Record<AllDataFile, number> = { books: bookRows.length, items: itemRows.length }
  const refreshing = loading && books !== null

  return (
    <div className="vbd-page">
      <TopbarActions>
        <DownloadMenu filters={filters} itemAnswers={itemAnswers} study={study} />
        <button type="button" className="vbd-dl vbd-refresh" onClick={() => setVersion((v) => v + 1)}>
          <AllDataIcon name="refresh" size={17} className={refreshing ? 'vbd-refresh-icon is-spinning' : 'vbd-refresh-icon'} />
          {refreshing ? 'Updating...' : 'Refresh'}
        </button>
      </TopbarActions>

      <TopbarBelow>
        <AllDataToolbar
          search={search}
          onSearch={setSearch}
          searchHint={file === 'books' ? 'Search by research ID...' : 'Search research ID or recipe...'}
          bookType={bookType}
          onBookType={setBookType}
          filters={filters}
          options={options}
          onFilters={setFilters}
          onClear={clearAll}
          canClear={hasFilters(filters) || search !== '' || bookType !== '' || study !== null}
        />
      </TopbarBelow>

      <StudyView study={study} onStudy={setStudy} books={bookRows.length} />

      <div className="vbd-tabs" role="tablist" aria-label="File">
        {fileTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === file}
            className={t.id === file ? 'vbd-tab is-active' : 'vbd-tab'}
            onClick={() => setFile(t.id)}
          >
            <AllDataIcon name={t.icon} size={20} />
            {t.label}
            <span className="vbd-tab-note">
              one row per {t.id === 'books' ? 'book' : 'recipe'} ({tabCounts[t.id]})
            </span>
          </button>
        ))}
      </div>

      {ready || error ? <AllDataCards cards={cards} /> : <CardRowSkeleton />}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!error && !ready && <AllDataSkeleton />}

      {ready && books && items && file === 'books' && (
        <>
          {columnsOpen && <ColumnToggles shown={groups} onChange={setGroups} />}

          <div className={selectedBook ? 'vbd-split has-panel' : 'vbd-split'}>
            <BooksTable
              key={`${books.generatedAt}-${bookType}-${search}`}
              rows={bookRows}
              columns={columns}
              selected={selectedKey}
              onSelect={openBook}
              head={
                <>
                  <span className="vbd-head-label">Answers as</span>
                  <Segmented
                    label="Answers as"
                    value={answersView}
                    onChange={setAnswersView}
                    options={[
                      { id: 'chips', label: 'Picked answers' },
                      { id: 'binary', label: '0/1 columns (SPSS)' },
                    ]}
                  />
                  <button
                    type="button"
                    className={columnsOpen ? 'vbd-head-btn is-pressed' : 'vbd-head-btn'}
                    aria-expanded={columnsOpen}
                    onClick={() => setColumnsOpen((o) => !o)}
                  >
                    Columns
                    <AllDataIcon name="down" size={16} />
                  </button>
                </>
              }
            />
            {selectedBook && (
              <BookPanel
                key={selectedKey}
                book={selectedBook}
                items={itemsByBook.get(bookKey(selectedBook)) ?? []}
                questions={questions}
                onClose={() => setPanelClosed(true)}
              />
            )}
          </div>
        </>
      )}

      {ready && books && items && file === 'items' && (
        <ItemsTable
          key={`${items.generatedAt}-${bookType}-${search}-${status}`}
          rows={itemRows}
          questions={questions}
          status={status}
          showAnswers={itemAnswers}
          head={
            <>
              <span className="vbd-head-label">Status</span>
              <Segmented
                label="Status"
                value={status}
                onChange={setStatus}
                options={[
                  { id: 'all', label: 'All' },
                  { id: 'kept', label: 'Kept' },
                  { id: 'out', label: 'Taken out' },
                ]}
              />
              <button
                type="button"
                aria-pressed={itemAnswers}
                className={itemAnswers ? 'vbd-head-btn is-on' : 'vbd-head-btn'}
                onClick={() => setItemAnswers((a) => !a)}
              >
                <span aria-hidden="true">{itemAnswers ? '✓' : '+'}</span>
                Book answers on each row
              </button>
            </>
          }
        />
      )}
    </div>
  )
}