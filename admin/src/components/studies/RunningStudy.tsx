import { useState } from 'react'
import type { StudySummary } from '../../types/studies'
import { StudyIcon, type StudyIconName } from './StudyIcons'
import { StudyNameEditor } from './StudyNameEditor'
import { fullDate, plural, studyTitle } from './studyFormat'

// The card at the top of the Studies page.
//
//   A study is running   its name (with a Rename button), its number, when
//                        it was switched on, how many days it has run, and
//                        four numbers: tracked, tracking off, joined from
//                        the notice, and books saved
//   None is running      when the last one ended, and a button to start the
//                        next (it opens the switch's confirm step)

type Props = {
  running: StudySummary | null
  latest: StudySummary
  nextNumber: number
  onStart: () => void
  onRename: (study: StudySummary, name: string) => Promise<string | null>
}

type Stat = { label: string; value: number; tone: 'green' | 'orange' | 'blue'; icon: StudyIconName }

export function RunningStudy({ running, latest, nextNumber, onStart, onRename }: Props) {
  const [editing, setEditing] = useState(false)

  if (!running) {
    return (
      <section className="tl-now">
        <span className="st-badge">
          <StudyIcon name="flask" size={24} />
        </span>
        <div className="tl-now-title">
          <strong>No study running</strong>
          <span className="tl-now-when">
            {studyTitle(latest)} ended {latest.endedAt ? fullDate(latest.endedAt) : ''}. Nothing is recorded until
            a study is switched on.
          </span>
        </div>
        <button type="button" className="st-button is-green tl-now-start" onClick={onStart}>
          <StudyIcon name="play" size={16} />
          Start Study {nextNumber}
        </button>
      </section>
    )
  }

  const stats: Stat[] = [
    { label: 'Tracked', value: running.tracked, tone: 'green', icon: 'signal' },
    { label: 'Tracking off', value: running.trackingOff, tone: 'orange', icon: 'off' },
    { label: 'Joined from notice', value: running.notice.joined, tone: 'blue', icon: 'bell' },
    { label: 'Books saved', value: running.booksSaved, tone: 'green', icon: 'book' },
  ]

  return (
    <section className="tl-now">
      <span className="st-badge is-running">
        <StudyIcon name="flask" size={24} />
      </span>
      <div className="tl-now-title">
        <span className="tl-now-name">
          {editing ? (
            <StudyNameEditor
              study={running}
              onSave={(name) => onRename(running, name)}
              onDone={() => setEditing(false)}
            />
          ) : (
            <>
              <strong>{studyTitle(running)}</strong>
              {running.name && <span className="se-number">Study {running.number}</span>}
              <span className="st-pill is-running">
                <i />
                Running
              </span>
              <button type="button" className="se-rename" onClick={() => setEditing(true)}>
                <StudyIcon name="pencil" size={14} />
                Rename
              </button>
            </>
          )}
        </span>
        <span className="tl-now-when">
          <StudyIcon name="calendar" size={14} />
          Switched on {fullDate(running.startedAt)}, running {plural(running.days, 'day', 'days')}
        </span>
      </div>
      <div className="tl-now-stats">
        {stats.map((s) => (
          <span key={s.label} className={`tl-now-stat is-${s.tone}`}>
            <span className="tl-now-stat-label">
              <StudyIcon name={s.icon} size={14} />
              {s.label}
            </span>
            <strong>{s.value.toLocaleString()}</strong>
          </span>
        ))}
      </div>
    </section>
  )
}