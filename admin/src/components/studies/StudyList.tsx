import type { StudySummary } from '../../types/studies'
import { studyDates } from './studyFormat'

// Every study, newest first. The running one has a green Running pill; the
// rest say Ended. Clicking one shows it on the right.

type Props = {
  studies: StudySummary[]
  selected: number | null
  onSelect: (id: number) => void
}

export function StudyList({ studies, selected, onSelect }: Props) {
  return (
    <aside className="st-list" aria-label="All studies">
      <div className="st-list-head">All studies</div>
      {studies.length === 0 ? (
        <p className="st-list-empty">None yet. Switch one on to start Study 1.</p>
      ) : (
        <ul>
          {studies.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={s.id === selected ? 'st-list-item is-selected' : 'st-list-item'}
                aria-current={s.id === selected ? 'true' : undefined}
                onClick={() => onSelect(s.id)}
              >
                <span className="st-list-line">
                  <strong>Study {s.number}</strong>
                  <span className={s.running ? 'st-pill is-running' : 'st-pill'}>
                    {s.running ? 'Running' : 'Ended'}
                  </span>
                </span>
                <span className="st-list-dates">{studyDates(s.startedAt, s.endedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}