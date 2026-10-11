import { useMemo } from 'react'
import type { StudySummary } from '../../types/studies'
import { studyFullTitle, studyRange, studyTitle } from './studyFormat'
import { timelineScale } from './timelineScale'

// The timeline bar: one block per study, placed by its dates, with month
// marks under it and a dashed line for today.
//
//   Running study   dark green with stripes
//   Ended study     light green
//   Picked study    blue ring around it
//
// Each block is a button: clicking it picks that study.

type Props = {
  studies: StudySummary[]
  selected: number | null // study id
  onSelect: (study: StudySummary) => void
}

export function TimelineBar({ studies, selected, onSelect }: Props) {
  // Today, to the minute the page was opened.
  const scale = useMemo(() => timelineScale(studies, new Date()), [studies])

  return (
    <div className="tl-bar">
      <div className="tl-track">
        {scale.months.map((m) => (
          <span key={m.label + m.at} className="tl-grid" style={{ left: `${m.at}%` }} aria-hidden="true" />
        ))}

        {scale.bars.map(({ study, left, width }) => {
          const classes = ['tl-span']
          if (study.running) classes.push('is-running')
          if (study.id === selected) classes.push('is-selected')
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

        <span className="tl-today" style={{ left: `${scale.today}%` }} aria-hidden="true">
          <span className="tl-today-label">Today</span>
        </span>
      </div>

      <div className="tl-months" aria-hidden="true">
        {scale.months
          .filter((m) => m.showLabel)
          .map((m) => (
            <span key={m.label + m.at} style={{ left: `${m.at}%` }}>
              {m.label}
            </span>
          ))}
      </div>
    </div>
  )
}