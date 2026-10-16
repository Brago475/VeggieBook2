import { useMemo } from 'react'
import type { StudySummary } from '../../types/studies'
import { studyFullTitle, studyRange, studyTitle } from './studyFormat'
import { timelineScale } from './timelineScale'

// The timeline bar for one year, January to December: one block per study,
// placed by its dates, with a mark for every month under it and a dashed
// line for today (on the current year only).
//
//   Running study       dark green with stripes
//   Ended study         light green
//   Picked study        blue ring around it
//   Crossing New Year   flat, faded edge on the side that goes on into
//                       the year before or after
//
// Each block is a button: clicking it picks that study.

type Props = {
  studies: StudySummary[]
  year: number
  selected: number | null // study id
  onSelect: (study: StudySummary) => void
}

export function TimelineBar({ studies, year, selected, onSelect }: Props) {
  // Today, to the minute the page was opened.
  const scale = useMemo(() => timelineScale(studies, year, new Date()), [studies, year])

  return (
    <div className="tl-bar">
      <div className="tl-track">
        {scale.months.map((m) => (
          <span key={m.label} className="tl-grid" style={{ left: `${m.at}%` }} aria-hidden="true" />
        ))}

        {scale.bars.map(({ study, left, width, cutStart, cutEnd }) => {
          const classes = ['tl-span']
          if (study.running) classes.push('is-running')
          if (study.id === selected) classes.push('is-selected')
          if (cutStart) classes.push('is-cut-start')
          if (cutEnd) classes.push('is-cut-end')
          return (
            <button
              key={study.id}
              type="button"
              className={classes.join(' ')}
              style={{ left: `${left}%`, width: `${width}%` }}
              aria-pressed={study.id === selected}
              title={`${studyFullTitle(study)}: ${studyRange(study.startedAt, study.endedAt)}`}
              onClick={() => onSelect(study)}
            >
              <span className="tl-span-name">{studyTitle(study)}</span>
            </button>
          )
        })}

        {scale.today !== null && (
          <span className="tl-today" style={{ left: `${scale.today}%` }} aria-hidden="true">
            <span className="tl-today-label">Today</span>
          </span>
        )}
      </div>

      <div className="tl-months" aria-hidden="true">
        {scale.months.map((m) => (
          <span key={m.label} style={{ left: `${m.at}%` }}>
            {m.label}
          </span>
        ))}
      </div>
    </div>
  )
}