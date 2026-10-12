import { useCallback, useMemo, useState } from 'react'
import { AllDataIcon } from '../components/alldata/AllDataIcons'
import { StudyView } from '../components/alldata/StudyView'
import { BookTile } from '../components/books/BookTile'
import { BookWindow } from '../components/books/BookWindow'
import { BooksFilters, noBookFilters, type BookFilters } from '../components/books/BooksFilters'
import { plural } from '../components/books/bookFormat'
import { TopbarActions } from '../components/layout/TopbarSlot'
import { useAdminBooks } from '../hooks/useAdminBooks'
import { allDataDownload } from '../utils/allDataQuery'
import { noFilters } from '../utils/researchQuery'
import '../styles/studies.css'
import '../styles/books.css'
import '../styles/books-vb.css'

// The Books page: every book in the study data, as covers in a grid.
//
//   Cards     books saved, VeggieBooks, Secrets Books, taken out later
//   Show      All data or One study, the same switch as All Data
//   Filters   book type, research ID, vegetable or category, sort
//   Grid      one cover per book, 24 at a time with Show more
//   Window    a book opened the way VeggieBook shows it, with About this
//             book beside it (components/books/BookWindow.tsx)
//
// Only books saved while the person's tracking was on. Admins and guests
// never appear, and people are shown by research ID only. Uploaded cover
// photos are never shown. Read only.
//
// Download gives the same All Data files, for the study picked here.

type Props = {
  // Opens All Data searched to this research ID.
  onOpenPersonData: (researchId: string) => void
}

const PAGE = 24

function Stat({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="bk-stat">
      <span className="bk-stat-label">{label}</span>
      <strong className="bk-stat-value">{value.toLocaleString()}</strong>
      <span className="bk-stat-note">{note}</span>
    </div>
  )
}

function percent(part: number, all: number): string {
  return all === 0 ? 'None yet' : `${Math.round((part / all) * 100)}% of books`
}

export function Books({ onOpenPersonData }: Props) {
  const [study, setStudy] = useState<number | null>(null)
  const { data, error, loading, reload } = useAdminBooks(study)
  const [filters, setFilters] = useState<BookFilters>(noBookFilters)
  const [limit, setLimit] = useState(PAGE)
  const [openKey, setOpenKey] = useState<string | null>(null)

  const shown = useMemo(() => {
    const needle = filters.search.trim().toUpperCase()
    const list = (data?.books ?? []).filter(
      (b) =>
        (filters.kind === 'all' || b.kind === filters.kind) &&
        (!filters.subject || `${b.kind}:${b.subjectCode ?? ''}` === filters.subject) &&
        (!needle || b.researchId.includes(needle)),
    )
    // The API sends newest first.
    return filters.sort === 'oldest' ? [...list].reverse() : list
  }, [data, filters])

  const close = useCallback(() => setOpenKey(null), [])

  function changeFilters(next: BookFilters) {
    setFilters(next)
    setLimit(PAGE)
  }

  function changeStudy(next: number | null) {
    setStudy(next)
    setLimit(PAGE)
    setOpenKey(null)
  }

  const at = openKey === null ? -1 : shown.findIndex((b) => b.key === openKey)
  const prev = at > 0 ? () => setOpenKey(shown[at - 1].key) : null
  const next = at >= 0 && at < shown.length - 1 ? () => setOpenKey(shown[at + 1].key) : null

  const studyExtra: Record<string, string> = study === null ? {} : { study: String(study) }

  return (
    <div className="bk-page">
      <TopbarActions>
        <a
          className="st-button is-green"
          href={allDataDownload('export', noFilters, { format: 'xlsx', ...studyExtra })}
          title="Every book and its recipes or secrets, in one Excel workbook"
          download
        >
          <AllDataIcon name="sheet" size={17} />
          Download Excel
        </a>
        <a
          className="st-button"
          href={allDataDownload('export', noFilters, { format: 'spss', ...studyExtra })}
          title="The same data, ready for SPSS"
          download
        >
          <AllDataIcon name="layers" size={17} />
          SPSS
        </a>
        <button type="button" className="st-button" onClick={() => void reload()}>
          <AllDataIcon name="refresh" size={17} className={loading ? 'bk-spin is-spinning' : 'bk-spin'} />
          {loading ? 'Updating...' : 'Refresh'}
        </button>
      </TopbarActions>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {data && (
        <div className="bk-stats">
          <Stat label="Books saved" value={data.counts.all} note="With tracking on" />
          <Stat label="VeggieBooks" value={data.counts.veggie} note={percent(data.counts.veggie, data.counts.all)} />
          <Stat label="Secrets Books" value={data.counts.secrets} note={percent(data.counts.secrets, data.counts.all)} />
          <Stat label="Taken out later" value={data.counts.takenOut} note="Recipes and secrets removed after saving" />
        </div>
      )}

      <div className="bk-card">
        <StudyView study={study} onStudy={changeStudy} books={data?.counts.all ?? 0} />
        {data && <BooksFilters data={data} value={filters} onChange={changeFilters} />}
      </div>

      {!data && !error && <p className="muted">Loading...</p>}

      {data && shown.length === 0 && (
        <p className="st-muted bk-empty">
          {data.books.length === 0
            ? study === null
              ? 'No books saved with tracking on yet.'
              : 'No books were saved during this study.'
            : 'No books match these filters.'}
        </p>
      )}

      {shown.length > 0 && (
        <>
          <div className="bk-grid">
            {shown.slice(0, limit).map((b) => (
              <BookTile key={b.key} book={b} onOpen={() => setOpenKey(b.key)} />
            ))}
          </div>

          <div className="bk-more">
            <span>
              Showing {Math.min(limit, shown.length).toLocaleString()} of {plural(shown.length, 'book', 'books')}
            </span>
            {limit < shown.length && (
              <button type="button" className="st-button" onClick={() => setLimit((n) => n + PAGE)}>
                Show more
              </button>
            )}
          </div>
        </>
      )}

      {openKey && (
        <BookWindow
          bookKey={openKey}
          onClose={close}
          onOpenData={(researchId) => {
            setOpenKey(null)
            onOpenPersonData(researchId)
          }}
          onPrev={prev}
          onNext={next}
        />
      )}
    </div>
  )
}