import { useCallback, useMemo, useState } from 'react'
import { AllDataIcon } from '../components/alldata/AllDataIcons'
import { StatCard } from '../components/common/StatCard'
import { ContentFilters } from '../components/content/ContentFilters'
import { ContentTile } from '../components/content/ContentTile'
import { ContentWindow } from '../components/content/ContentWindow'
import {
  applyContentFilters,
  libraryItems,
  noContentFilters,
  type ContentFilterState,
} from '../components/content/contentItems'
import { TopbarActions } from '../components/layout/TopbarSlot'
import { ContentSkeleton } from '../components/skeletons/ContentSkeleton'
import { useContentLibrary } from '../hooks/useContentLibrary'
import { useHeld } from '../hooks/useHeld'
import '../styles/studies.css'
import '../styles/content-library.css'

// Admin Content page: every recipe and secret, read-only, with how often
// each was kept or taken out in tracked books. Opening one shows it the
// way the app does (ContentWindow).

const PAGE = 24

export function Content() {
  const { data, error, loading, reload } = useContentLibrary()
  const [filters, setFilters] = useState<ContentFilterState>(noContentFilters)
  const [limit, setLimit] = useState(PAGE)
  const [openKey, setOpenKey] = useState<string | null>(null)
  // Outline stays up briefly even on a fast load.
  const firstLoad = useHeld(!data && !error)
  const ready = !!data && !firstLoad

  const items = useMemo(() => (data ? libraryItems(data, filters.kind) : []), [data, filters.kind])
  const shown = useMemo(() => applyContentFilters(items, filters), [items, filters])

  const subjects = useMemo(() => {
    if (!data) return []
    return filters.kind === 'recipe'
      ? data.vegetables.map((v) => ({ value: v.code, label: v.name }))
      : data.categories.map((c) => ({ value: String(c.id), label: c.name }))
  }, [data, filters.kind])

  const stats = useMemo(() => {
    if (!data) return null
    const sum = (list: { kept: number }[]) => list.reduce((n, i) => n + i.kept, 0)
    return {
      vegetables: data.vegetables.filter((v) => v.active).length,
      vegetablesRetired: data.vegetables.filter((v) => !v.active).length,
      recipes: data.recipes.filter((r) => r.active).length,
      recipesRetired: data.recipes.filter((r) => !r.active).length,
      recipesKept: sum(data.recipes),
      categories: data.categories.length,
      secrets: data.secrets.filter((s) => s.active).length,
      secretsRetired: data.secrets.filter((s) => !s.active).length,
      secretsKept: sum(data.secrets),
    }
  }, [data])

  const close = useCallback(() => setOpenKey(null), [])

  function change(next: ContentFilterState) {
    setFilters(next)
    setLimit(PAGE)
    setOpenKey(null)
  }

  const at = openKey === null ? -1 : shown.findIndex((i) => i.key === openKey)
  const opened = at >= 0 ? shown[at] : null
  const prev = at > 0 ? () => setOpenKey(shown[at - 1].key) : null
  const next = at >= 0 && at < shown.length - 1 ? () => setOpenKey(shown[at + 1].key) : null

  const retiredNote = (n: number, fallback: string) => (n > 0 ? `${n.toLocaleString()} retired` : fallback)

  return (
    <div className="ct-page">
      <TopbarActions>
        <span className="ct-readonly">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Read only
        </span>
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

      {!error && !ready && <ContentSkeleton />}

      {ready && data && stats && (
        <>
          <div className="ct-stats">
            <StatCard
              index={0}
              icon="content"
              label="Vegetables"
              value={stats.vegetables}
              note={retiredNote(stats.vegetablesRetired, 'All shown in the app')}
            />
            <StatCard
              index={1}
              icon="book"
              label="Recipes"
              value={stats.recipes}
              chip={`Kept ${stats.recipesKept.toLocaleString()} times`}
              chipUp={stats.recipesKept > 0}
              note={retiredNote(stats.recipesRetired, 'From the original VeggieBook')}
            />
            <StatCard
              index={2}
              icon="study"
              label="Secret categories"
              value={stats.categories}
              note="Shown in the Secrets flow"
            />
            <StatCard
              index={3}
              icon="lock"
              label="Secrets"
              value={stats.secrets}
              chip={`Kept ${stats.secretsKept.toLocaleString()} times`}
              chipUp={stats.secretsKept > 0}
              note={retiredNote(stats.secretsRetired, 'Across all categories')}
            />
          </div>

          <ContentFilters
            value={filters}
            onChange={change}
            counts={{ recipe: data.recipes.length, secret: data.secrets.length }}
            subjects={subjects}
          />

          {shown.length === 0 ? (
            <p className="st-muted">Nothing matches these filters.</p>
          ) : (
            <>
              <div className="ct-grid">
                {shown.slice(0, limit).map((item) => (
                  <ContentTile key={item.key} item={item} onOpen={() => setOpenKey(item.key)} />
                ))}
              </div>

              <div className="ct-more">
                <span>
                  Showing {Math.min(limit, shown.length).toLocaleString()} of {shown.length.toLocaleString()}
                </span>
                {limit < shown.length && (
                  <button type="button" className="st-button" onClick={() => setLimit((n) => n + PAGE)}>
                    Show more
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}

      {opened && <ContentWindow item={opened} onClose={close} onPrev={prev} onNext={next} />}
    </div>
  )
}