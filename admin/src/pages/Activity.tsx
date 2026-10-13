import { useMemo, useState } from 'react'
import { ActivityFeed } from '../components/activity/ActivityFeed'
import { csvRows, groups, inGroup, localDate, type ActivityGroup } from '../components/activity/activityFormat'
import { AllDataIcon } from '../components/alldata/AllDataIcons'
import { StudyView } from '../components/alldata/StudyView'
import { StatCard } from '../components/common/StatCard'
import { TopbarActions } from '../components/layout/TopbarSlot'
import { downloadCsv } from '../components/questions/questionMath'
import { ActivitySkeleton } from '../components/skeletons/ActivitySkeleton'
import { useActivity } from '../hooks/useActivity'
import { useHeld } from '../hooks/useHeld'
import type { ActivityEvent } from '../types/activity'
import '../styles/studies.css'
import '../styles/books.css'
import '../styles/activity.css'

// Admin Activity page: the full, permanent activity history with type,
// research ID, date, and study filters. Filtering and paging are client-side.

const PAGE = 50
const DAY = 24 * 60 * 60 * 1000

function chipDiff(now: number, before: number): string {
  const d = now - before
  return `${d >= 0 ? '+' : ''}${d} vs last week`
}

export function Activity() {
  const [study, setStudy] = useState<number | null>(null)
  const { data, error, loading, reload } = useActivity(study)
  const [group, setGroup] = useState<ActivityGroup>('all')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [limit, setLimit] = useState(PAGE)
  // Outline stays up briefly even on a fast load.
  const firstLoad = useHeld(!data && !error)
  const ready = data !== null && data !== undefined && !firstLoad

  const all = useMemo(() => data?.events ?? [], [data])

  // Search and dates apply before the type chips, so chip counts match.
  const base = useMemo(() => {
    const needle = search.trim().toUpperCase()
    return all.filter((e) => {
      const day = localDate(e.at)
      return (!needle || (e.researchId ?? '').includes(needle)) && (!from || day >= from) && (!to || day <= to)
    })
  }, [all, search, from, to])

  const shown = useMemo(() => base.filter((e) => inGroup(e, group)), [base, group])

  const week = useMemo(() => {
    const now = Date.now()
    const inRange = (e: ActivityEvent, start: number, end: number) => {
      const t = new Date(e.at).getTime()
      return t >= start && t < end
    }
    const thisWeek = all.filter((e) => inRange(e, now - 7 * DAY, now + DAY))
    const lastWeek = all.filter((e) => inRange(e, now - 14 * DAY, now - 7 * DAY))
    const count = (list: ActivityEvent[], ...types: string[]) => list.filter((e) => types.includes(e.type)).length
    return {
      all: thisWeek.length,
      allBefore: lastWeek.length,
      saved: count(thisWeek, 'book_saved'),
      savedBefore: count(lastWeek, 'book_saved'),
      joined: count(thisWeek, 'joined'),
      joinedBefore: count(lastWeek, 'joined'),
      booksDeleted: count(thisWeek, 'book_deleted'),
      accountsDeleted: count(thisWeek, 'account_deleted'),
    }
  }, [all])

  function changeStudy(next: number | null) {
    setStudy(next)
    setLimit(PAGE)
  }

  const filtered = group !== 'all' || search || from || to

  return (
    <div className="av-page">
      <TopbarActions>
        <button type="button" className="st-button is-green" onClick={() => downloadCsv('activity.csv', csvRows(shown))} disabled={shown.length === 0}>
          <AllDataIcon name="sheet" size={17} />
          Download CSV
        </button>
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

      {!error && !ready && <ActivitySkeleton />}

      {ready && (
        <div className="bk-stats">
          <StatCard index={0} icon="activity" label="Activity this week" value={week.all} chip={chipDiff(week.all, week.allBefore)} chipUp={week.all >= week.allBefore} note="All events, last 7 days" />
          <StatCard index={1} icon="book" label="Books saved" value={week.saved} chip={chipDiff(week.saved, week.savedBefore)} chipUp={week.saved >= week.savedBefore} note="Last 7 days, tracking on" />
          <StatCard index={2} icon="users" label="Joined" value={week.joined} chip={chipDiff(week.joined, week.joinedBefore)} chipUp={week.joined >= week.joinedBefore} note="New participants, last 7 days" />
          <StatCard
            index={3}
            icon="trash"
            label="Deleted"
            value={week.booksDeleted + week.accountsDeleted}
            chip="Last 7 days"
            note={`${week.booksDeleted} ${week.booksDeleted === 1 ? 'book' : 'books'}, ${week.accountsDeleted} ${week.accountsDeleted === 1 ? 'account' : 'accounts'}`}
          />
        </div>
      )}

      {ready && (
        <div className="bk-card">
          <StudyView study={study} onStudy={changeStudy} books={shown.length} />
          <div className="bk-tabs" role="tablist" aria-label="Activity type">
            {groups.map((g) => {
              const count = base.filter((e) => inGroup(e, g.id)).length
              return (
                <button
                  key={g.id}
                  type="button"
                  role="tab"
                  aria-selected={group === g.id}
                  className={group === g.id ? 'bk-tab is-on' : 'bk-tab'}
                  onClick={() => {
                    setGroup(g.id)
                    setLimit(PAGE)
                  }}
                >
                  {g.label} <span>{count.toLocaleString()}</span>
                </button>
              )
            })}
          </div>
          <div className="bk-filter-row">
            <label className="bk-search">
              <AllDataIcon name="search" size={16} />
              <input
                type="search"
                placeholder="Search by research ID..."
                aria-label="Search by research ID"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setLimit(PAGE)
                }}
              />
            </label>
            <label className="bk-select">
              <span>From</span>
              <input type="date" className="av-date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="bk-select">
              <span>To</span>
              <input type="date" className="av-date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
            </label>
            {filtered && (
              <button
                type="button"
                className="st-button"
                onClick={() => {
                  setGroup('all')
                  setSearch('')
                  setFrom('')
                  setTo('')
                  setLimit(PAGE)
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {ready && (
        <section className="av-card" aria-labelledby="av-title">
          <div className="av-head">
            <h2 id="av-title">All activity</h2>
            <span>Newest first, kept permanently</span>
          </div>

          {shown.length === 0 ? (
            <p className="st-muted av-empty">{all.length === 0 ? 'No activity yet.' : 'No activity matches these filters.'}</p>
          ) : (
            <>
              <ActivityFeed events={shown.slice(0, limit)} />
              <div className="av-more">
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
        </section>
      )}
    </div>
  )
}