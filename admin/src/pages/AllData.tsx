import { useEffect, useMemo, useState } from 'react'
import { AllDataCards } from '../components/alldata/AllDataCards'
import type { AllDataCard } from '../components/alldata/AllDataCards'
import { AllDataToolbar } from '../components/alldata/AllDataToolbar'
import { BookPanel } from '../components/alldata/BookPanel'
import { BooksTable } from '../components/alldata/BooksTable'
import { ColumnToggles } from '../components/alldata/ColumnToggles'
import { DownloadMenu } from '../components/alldata/DownloadMenu'
import { ItemsTable } from '../components/alldata/ItemsTable'
import { Segmented } from '../components/alldata/Segmented'
import { TopbarActions } from '../components/layout/TopbarSlot'
import { useAllData } from '../hooks/useAllData'
import type { AllDataFile, AnswersView, BookTypeFilter, ColumnGroup, ItemStatusFilter } from '../types/allData'
import type { ResearchFilters, ResearchOptions, SheetRow } from '../types/research'
import { api } from '../utils/api'
import { bookColumns } from '../utils/allDataColumns'
import { bookKey, dateRange } from '../utils/allDataFormat'
import { noFilters } from '../utils/researchQuery'
import '../styles/alldata.css'
import '../styles/alldata-filters.css'
import '../styles/alldata-table.css'
import '../styles/alldata-colors.css'
import '../styles/alldata-preview.css'
import '../styles/alldata-topbar.css'

// The All Data page: everything collected, in two files.
//
//   Books                one row per book: person, date and time, every
//                        answer, and counts of recipes and secrets
//   Recipes and secrets  one row per recipe or secret, grouped by book
//
// The search, filters, and the Excel, PDF, and CSV buttons sit in the top
// bar; each button downloads both files together.
// Rows are keyed by the anonymous research ID; no email or name appears.

const fileTabs: { id: AllDataFile; label: string }[] = [
  { id: 'books', label: 'Books' },
  { id: 'items', label: 'Recipes and secrets' },
]

const allGroups: Record<ColumnGroup, boolean> = { person: true, book: true, answers: true, items: true }

function matchesSearch(row: SheetRow, text: string, withTitle: boolean) {
  if (!text) return true
  const needle = text.trim().toLowerCase()
  if (String(row.participant_id ?? '').toLowerCase().includes(needle)) return true
  return withTitle && String(row.item_title ?? '').toLowerCase().includes(needle)
}

export function AllData() {
  const [file, setFile] = useState<AllDataFile>('books')
  const [filters, setFilters] = useState<ResearchFilters>(noFilters)
  const [options, setOptions] = useState<ResearchOptions | null>(null)
  const [version, setVersion] = useState(0)
  const [search, setSearch] = useState('')
  const [bookType, setBookType] = useState<BookTypeFilter>('')
  const [selected, setSelected] = useState<string | null>(null)
  const [panelClosed, setPanelClosed] = useState(false)
  const [answersView, setAnswersView] = useState<AnswersView>('chips')
  const [groups, setGroups] = useState<Record<ColumnGroup, boolean>>(allGroups)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [status, setStatus] = useState<ItemStatusFilter>('all')
  const [itemAnswers, setItemAnswers] = useState(false)

  const { books, items, questions, error, loading } = useAllData(filters, version)

  useEffect(() => {
    let cancelled = false
    api<ResearchOptions>('/admin/research/options')
      .then((o) => {
        if (!cancelled) setOptions(o)
      })
      .catch(() => {
        // The filters still work without the lists; they just start empty.
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
  // The side panel is always open on a book: the one clicked, or the first
  // row until one is clicked. The close button hides it until the next click.
  const selectedBook = panelClosed
    ? null
    : (selected ? bookRows.find((r) => bookKey(r) === selected) : undefined) ?? bookRows[0] ?? null
  const selectedKey = selectedBook ? bookKey(selectedBook) : null

  function openBook(key: string) {
    setSelected(key)
    setPanelClosed(false)
  }

  const veggieCount = bookRows.filter((r) => r.book_type === 'VeggieBook').length
  const secretsCount = bookRows.length - veggieCount
  const people = new Set(bookRows.map((r) => r.participant_id)).size

  const cards: AllDataCard[] =
    file === 'books'
      ? [
          { label: 'VeggieBooks', value: String(veggieCount), mark: 'V', tone: 'green' },
          { label: 'Secrets Books', value: String(secretsCount), mark: 'S', tone: 'violet' },
          { label: 'Participants', value: String(people), mark: 'P', tone: 'blue' },
          { label: 'Dates covered', value: dateRange(bookRows), mark: 'D', tone: 'blue' },
        ]
      : (() => {
          const kept = itemRows.filter((r) => r.status === 'Kept').length
          const out = itemRows.length - kept
          const pct = (n: number) => (itemRows.length ? `${Math.round((n / itemRows.length) * 100)}%` : '')
          const different = new Set(itemRows.map((r) => `${r.item_type}:${r.item_code ?? ''}:${r.item_title}`)).size
          return [
            { label: 'Recipes and secrets', value: String(itemRows.length), mark: '#', note: `in ${bookRows.length} books`, tone: 'blue' },
            { label: 'Still kept', value: String(kept), mark: 'K', note: pct(kept), tone: 'green' },
            { label: 'Taken out later', value: String(out), mark: 'T', note: pct(out), tone: 'orange', warn: out > 0 },
            { label: 'Different recipes and secrets', value: String(different), mark: 'R', tone: 'violet' },
          ]
        })()

  const tabCounts: Record<AllDataFile, number> = { books: bookRows.length, items: itemRows.length }

  return (
    <div className="ad-page">
      <div className="ad-tabs" role="tablist" aria-label="File">
        {fileTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === file}
            className={t.id === file ? 'ad-tab is-active' : 'ad-tab'}
            onClick={() => setFile(t.id)}
          >
            {t.label}
            <span className="ad-tab-note">
              one row per {t.id === 'books' ? 'book' : 'recipe'} ({tabCounts[t.id]})
            </span>
          </button>
        ))}
        <button type="button" className="button-secondary ad-refresh" onClick={() => setVersion((v) => v + 1)}>
          <svg
            className={loading && books ? 'ad-refresh-icon is-spinning' : 'ad-refresh-icon'}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
          {loading && books ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      <AllDataCards cards={cards} />

      <TopbarActions>
        <AllDataToolbar
          search={search}
          onSearch={setSearch}
          searchHint={file === 'books' ? 'Search by research ID' : 'Search research ID or recipe'}
          bookType={bookType}
          onBookType={setBookType}
          filters={filters}
          options={options}
          onFilters={setFilters}
          actions={<DownloadMenu filters={filters} itemAnswers={itemAnswers} />}
        />
      </TopbarActions>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!books && !error && <p className="muted">Loading...</p>}

      {books && items && file === 'books' && (
        <>
          <div className="ad-view-bar">
            <div className="ad-view-left">
              <span className="muted small">Answers as</span>
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
                className={columnsOpen ? 'button-secondary is-pressed' : 'button-secondary'}
                aria-expanded={columnsOpen}
                onClick={() => setColumnsOpen((o) => !o)}
              >
                Columns
              </button>
            </div>
          </div>

          {columnsOpen && <ColumnToggles shown={groups} onChange={setGroups} />}

          <div className={selectedBook ? 'ad-split has-panel' : 'ad-split'}>
            <BooksTable
              key={`${books.generatedAt}-${bookType}-${search}`}
              rows={bookRows}
              columns={columns}
              selected={selectedKey}
              onSelect={openBook}
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

      {books && items && file === 'items' && (
        <>
          <div className="ad-view-bar">
            <div className="ad-view-left">
              <span className="muted small">Status</span>
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
                className={itemAnswers ? 'ad-chip-toggle is-on' : 'ad-chip-toggle'}
                onClick={() => setItemAnswers((a) => !a)}
              >
                <span aria-hidden="true">{itemAnswers ? '✓' : '+'}</span>
                Book answers on each row
              </button>
            </div>
          </div>

          <ItemsTable
            key={`${items.generatedAt}-${bookType}-${search}-${status}`}
            rows={itemRows}
            questions={questions}
            status={status}
            showAnswers={itemAnswers}
          />
        </>
      )}
    </div>
  )
}