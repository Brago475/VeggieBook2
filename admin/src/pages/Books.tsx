import { useCallback, useMemo, useState } from 'react'
import { AllDataIcon } from '../components/alldata/AllDataIcons'
import { StudyView } from '../components/alldata/StudyView'
import { BookTile } from '../components/books/BookTile'
import { BookWindow } from '../components/books/BookWindow'
import { BooksFilters, noBookFilters, type BookFilters } from '../components/books/BooksFilters'
import { plural } from '../components/books/bookFormat'
import { StatCard } from '../components/common/StatCard'
import { TopbarActions } from '../components/layout/TopbarSlot'
import { BooksSkeleton } from '../components/skeletons/BooksSkeleton'
import { useAdminBooks } from '../hooks/useAdminBooks'
import { useHeld } from '../hooks/useHeld'
import { allDataDownload } from '../utils/allDataQuery'
import { noFilters } from '../utils/researchQuery'
import '../styles/studies.css'
import '../styles/books.css'
import '../styles/books-vb.css'

// Admin Books page: tracked books as a cover grid, filterable by study,
// type, research ID, and subject. Opening a book shows BookWindow.

type Props = {
  onOpenPersonData: (researchId: string) => void
}

const PAGE = 24

function percent(part: number, all: number): string {
  return all === 0 ? '0%' : `${Math.round((part / all) * 100)}%`
}

export function Books({ onOpenPersonData }: Props) {
  const [study, setStudy] = useState<number | null>(null)
  const { data, error, loading, reload } = useAdminBooks(study)
  const [filters, setFilters] = useState<BookFilters>(noBookFilters)
  const [limit, setLimit] = useState(PAGE)
  const [openKey, setOpenKey] = useState<string | null>(null)
  // Outline stays up briefly even on a fast load.
  const firstLoad = useHeld(!data && !error)
  const ready = !!data && !firstLoad

  // The API returns newest first.
  const shown = useMemo(() => {
    const needle = filters.search.trim().toUpperCase()
    const list = (data?.books ?? []).filter(
      (b) =>
        (filters.kind === 'all' || b.kind === filters.kind) &&
        (!filters.subject || `${b.kind}:${b.subjectCode ?? ''}` === filters.subject) &&
        (!needle || b.researchId.includes(needle)),
    )
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

  const totals = useMemo(() => {
    const books = data?.books ?? []
    const sum = (list: typeof books, pick: (b: (typeof books)[number]) => number) =>
      list.reduce((n, b) => n + pick(b), 0)
    return {
      recipes: sum(books.filter((b) => b.kind === 'veggie'), (b) => b.kept),
      secrets: sum(books.filter((b) => b.kind === 'secrets'), (b) => b.kept),
      items: sum(books, (b) => b.kept + b.removed),
    }
  }, [data])

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

      {!error && !ready && <BooksSkeleton />}

      {ready && data && (
        <div className="bk-stats">
          <StatCard
            index={0}
            icon="book"
            label="Books saved"
            value={data.counts.all}
            chip={study === null ? 'All data' : `Study ${study}`}
            note="With tracking on"
          />
          <StatCard
            index={1}
            icon="content"
            label="VeggieBooks"
            value={data.counts.veggie}
            chip={percent(data.counts.veggie, data.counts.all)}
            chipUp
            note={`${plural(totals.recipes, 'recipe', 'recipes')} kept`}
          />
          <StatCard
            index={2}
            icon="lock"
            label="Secrets Books"
            value={data.counts.secrets}
            chip={percent(data.counts.secrets, data.counts.all)}
            chipUp
            note={`${plural(totals.secrets, 'secret', 'secrets')} kept`}
          />
          <StatCard
            index={3}
            icon="trash"
            label="Taken out later"
            value={data.counts.takenOut}
            chip={`${percent(data.counts.takenOut, totals.items)} of items`}
            chipUp
            note="Recipes and secrets removed after saving"
          />
        </div>
      )}

      {ready && data && (
        <div className="bk-card">
          <StudyView study={study} onStudy={changeStudy} books={data.counts.all} />
          <BooksFilters data={data} value={filters} onChange={changeFilters} />
        </div>
      )}

      {ready && data && shown.length === 0 && (
        <p className="st-muted bk-empty">
          {data.books.length === 0
            ? study === null
              ? 'No books saved with tracking on yet.'
              : 'No books were saved during this study.'
            : 'No books match these filters.'}
        </p>
      )}

      {ready && shown.length > 0 && (
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