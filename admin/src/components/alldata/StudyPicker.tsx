import { useState } from 'react'
import { useStudies } from '../../hooks/useStudies'
import type { StudySummary } from '../../types/studies'
import { TimelineBar } from '../studies/TimelineBar'
import { plural, studyRange } from '../studies/studyFormat'
import { AllDataIcon } from './AllDataIcons'
import '../../styles/studies-timeline.css'
import '../../styles/alldata-study.css'

// The Study bar on All Data. Folded, it is one line saying which study the
// page shows ("All time", or "Study 3: October 11, 2026 to now, 4 books").
// Clicking it opens:
//
//   chips      All time, then each study with its dates
//   timeline   the small version of the Studies page timeline; clicking a
//              study on it picks that study
//
// Clicking again folds it away. The X on the folded line goes back to All
// time without opening it.
//
// Picking a study reloads the page's data (and its downloads) with only the
// books saved during that study, by people whose tracking was on at the
// moment they saved (api/Research/AllData/AllDataStudy.cs).

type Props = {
  study: number | null // study number
  onStudy: (study: number | null) => void
  books: number // books shown right now
}

const ZONE = 'America/New_York'
const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: ZONE })

// "Jul 6 to Jul 24", or "Oct 11 to now" while it runs.
function chipDates(s: StudySummary): string {
  const start = monthDay.format(new Date(s.startedAt))
  return s.endedAt ? `${start} to ${monthDay.format(new Date(s.endedAt))}` : `${start} to now`
}

export function StudyPicker({ study, onStudy, books }: Props) {
  const { data } = useStudies()
  const [open, setOpen] = useState(false)

  const studies = data?.studies ?? [] // newest first
  const oldestFirst = [...studies].reverse()
  const picked = studies.find((s) => s.number === study) ?? null

  return (
    <section className={open ? 'ads is-open' : 'ads'} aria-label="Study">
      <div className="ads-line">
        <button
          type="button"
          className="ads-toggle"
          aria-expanded={open}
          aria-controls="ads-body"
          onClick={() => setOpen((o) => !o)}
        >
          <AllDataIcon name="calendar" size={16} />
          <span className="ads-label">Study</span>
          {study === null ? (
            <span className="ads-current">All time</span>
          ) : (
            <span className="ads-current is-picked">
              <strong>Study {study}</strong>
              {picked && <span>{studyRange(picked.startedAt, picked.endedAt)}</span>}
            </span>
          )}
          {study !== null && <span className="ads-count">{plural(books, 'book', 'books')}</span>}
          <span className="ads-chevron">
            <AllDataIcon name="down" size={16} />
          </span>
        </button>

        {study !== null && (
          <button type="button" className="ads-clear" aria-label="Show all time" title="Show all time" onClick={() => onStudy(null)}>
            <AllDataIcon name="close" size={14} />
          </button>
        )}
      </div>

      {open && (
        <div id="ads-body" className="ads-body">
          {studies.length === 0 ? (
            <p className="ads-empty">No studies yet. A study is switched on from the Studies page.</p>
          ) : (
            <>
              <div className="ads-chips" role="group" aria-label="Pick a study">
                <button
                  type="button"
                  className={study === null ? 'ads-chip is-on' : 'ads-chip'}
                  aria-pressed={study === null}
                  onClick={() => onStudy(null)}
                >
                  All time
                </button>
                {oldestFirst.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={s.number === study ? 'ads-chip is-on' : 'ads-chip'}
                    aria-pressed={s.number === study}
                    onClick={() => onStudy(s.number)}
                  >
                    {s.running && <i className="ads-dot" aria-hidden="true" />}
                    Study {s.number}
                    <span className="ads-chip-dates">{chipDates(s)}</span>
                  </button>
                ))}
              </div>

              <TimelineBar
                studies={studies}
                selected={picked?.id ?? null}
                onSelect={(s) => onStudy(s.number)}
                mini
              />

              <p className="ads-note">
                {picked
                  ? `Only books saved during Study ${picked.number}, by people whose tracking was on at the time. Downloads match.`
                  : 'Every book, including those saved before and between studies.'}
              </p>
            </>
          )}
        </div>
      )}
    </section>
  )
}