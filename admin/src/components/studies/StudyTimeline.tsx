import type { StudySummary } from '../../types/studies'
import { StudyIcon } from './StudyIcons'
import { studyRange } from './studyFormat'
import { TimelineBar } from './TimelineBar'

// The Timeline card on the Studies page: the bar with every study placed by
// its dates, and under it one row per study (newest first) with its dates,
// how many people were tracked, and how many books were saved.
//
// Clicking a study, on the bar or in the list, shows its data below.

type Props = {
  studies: StudySummary[] // newest first
  selected: number | null // study id
  onSelect: (study: StudySummary) => void
}

export function StudyTimeline({ studies, selected, onSelect }: Props) {
  return (
    <section className="tl-card" aria-labelledby="tl-title">
      <div className="tl-head">
        <h2 id="tl-title">Timeline</h2>
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

      <TimelineBar studies={studies} selected={selected} onSelect={onSelect} />

      <ul className="tl-list">
        {studies.map((s) => {
          const isSelected = s.id === selected
          return (
            <li key={s.id}>
              <button
                type="button"
                className={isSelected ? 'tl-row is-selected' : 'tl-row'}
                aria-pressed={isSelected}
                onClick={() => onSelect(s)}
              >
                <span className={s.running ? 'tl-swatch is-running' : 'tl-swatch'} aria-hidden="true" />
                <span className="tl-row-name">
                  <strong>Study {s.number}</strong>
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
            </li>
          )
        })}
      </ul>
    </section>
  )
}