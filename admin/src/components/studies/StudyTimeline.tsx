import { useMemo, useState } from 'react'
import type { StudySummary } from '../../types/studies'
import { StudyIcon } from './StudyIcons'
import { StudyNameEditor } from './StudyNameEditor'
import { studyRange, studyTitle } from './studyFormat'
import { TimelineBar } from './TimelineBar'
import { inYear, yearRange } from './timelineScale'
import '../../styles/studies-year.css'

// The Timeline card on the Studies page.
//
//   Year     arrows to move between years, from the year of the first
//            study to this year. Opens on this year. "This year" jumps
//            back when another year is showing.
//   Bar      January to December of that year, with every study that ran
//            during it placed by its dates (TimelineBar.tsx)
//   List     one row per study that ran during that year (newest first),
//            with its name, dates, how many people were tracked, and how
//            many books were saved
//
// Clicking a study, on the bar or in the list, shows its data below. Each
// row also has a pencil to rename the study and, for ended studies, a trash
// can that opens the delete warning (a running study must be switched off
// first).

type Props = {
  studies: StudySummary[] // newest first
  selected: number | null // study id
  onSelect: (study: StudySummary) => void
  onRename: (study: StudySummary, name: string) => Promise<string | null>
  onDelete: (study: StudySummary) => void
}

function Arrow({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  )
}

export function StudyTimeline({ studies, selected, onSelect, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState<number | null>(null) // study id
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)

  const range = useMemo(() => yearRange(studies, new Date()), [studies])
  const shown = useMemo(() => studies.filter((s) => inYear(s, year, new Date())), [studies, year])

  return (
    <section className="tl-card" aria-labelledby="tl-title">
      <div className="tl-head">
        <h2 id="tl-title">Timeline</h2>

        <div className="ty-nav" aria-label="Year">
          <button
            type="button"
            className="ty-arrow"
            aria-label={`Show ${year - 1}`}
            disabled={year <= range.first}
            onClick={() => setYear((y) => y - 1)}
          >
            <Arrow dir="left" />
          </button>
          <strong className="ty-year" aria-live="polite">
            {year}
          </strong>
          <button
            type="button"
            className="ty-arrow"
            aria-label={`Show ${year + 1}`}
            disabled={year >= range.last}
            onClick={() => setYear((y) => y + 1)}
          >
            <Arrow dir="right" />
          </button>
          {year !== thisYear && (
            <button type="button" className="ty-today" onClick={() => setYear(thisYear)}>
              This year
            </button>
          )}
        </div>

        <span className="tl-key">
          <span>
            <i className="tl-key-swatch is-running" />
            Running
          </span>
          <span>
            <i className="tl-key-swatch" />
            Ended
          </span>
        </span>
      </div>

      <TimelineBar studies={studies} year={year} selected={selected} onSelect={onSelect} />

      {shown.length === 0 && <p className="ty-empty">No studies ran in {year}.</p>}

      <ul className="tl-list">
        {shown.map((s) => {
          const isSelected = s.id === selected
          return (
            <li key={s.id} className={isSelected ? 'tl-row is-selected' : 'tl-row'}>
              {editing === s.id ? (
                <span className="tl-row-editing">
                  <span className={s.running ? 'tl-swatch is-running' : 'tl-swatch'} aria-hidden="true" />
                  <StudyNameEditor study={s} onSave={(name) => onRename(s, name)} onDone={() => setEditing(null)} />
                </span>
              ) : (
                <button
                  type="button"
                  className="tl-row-pick"
                  aria-pressed={isSelected}
                  onClick={() => onSelect(s)}
                >
                  <span className={s.running ? 'tl-swatch is-running' : 'tl-swatch'} aria-hidden="true" />
                  <span className="tl-row-name">
                    <strong>{studyTitle(s)}</strong>
                    {s.name && <span className="se-number">Study {s.number}</span>}
                    <span className={s.running ? 'st-pill is-running' : 'st-pill'}>
                      {s.running && <i />}
                      {s.running ? 'Running' : 'Ended'}
                    </span>
                  </span>
                  <span className="tl-row-dates">
                    <StudyIcon name="calendar" size={14} />
                    {studyRange(s.startedAt, s.endedAt)}
                  </span>
                  <span className="tl-row-count">
                    <strong>{s.tracked.toLocaleString()}</strong> tracked
                  </span>
                  <span className="tl-row-count">
                    <strong>{s.booksSaved.toLocaleString()}</strong> {s.booksSaved === 1 ? 'book' : 'books'}
                  </span>
                  <span className="tl-row-action">{isSelected ? 'Showing below' : 'Show data'}</span>
                </button>
              )}

              <span className="tl-row-tools">
                <button
                  type="button"
                  className="se-icon"
                  aria-label={`Rename ${studyTitle(s)}`}
                  title="Rename"
                  onClick={() => setEditing(s.id)}
                >
                  <StudyIcon name="pencil" size={15} />
                </button>
                <button
                  type="button"
                  className="se-icon is-danger"
                  aria-label={`Delete ${studyTitle(s)}`}
                  title={s.running ? 'Switch it off before deleting it' : 'Delete'}
                  disabled={s.running}
                  onClick={() => onDelete(s)}
                >
                  <StudyIcon name="trash" size={15} />
                </button>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}