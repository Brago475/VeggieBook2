import type { StudySummary } from '../../types/studies'
import { OffIdList } from './OffIdList'
import { StudyIcon, type StudyIconName } from './StudyIcons'
import { fullDateTime, plural } from './studyFormat'

// One study: when it ran, its four numbers, the research IDs of people with
// tracking off, and links to the people and the data.
//
// For the running study the numbers are as of now; for an ended one, as of
// the moment it was switched off.

type Props = {
  study: StudySummary
  onOpenParticipants: () => void
  onOpenData: () => void
}

type Stat = {
  label: string
  value: number
  note: string
  icon: StudyIconName
  tone: 'green' | 'orange' | 'blue'
}

export function StudyDetail({ study, onOpenParticipants, onOpenData }: Props) {
  const offBySelf = study.offIds.filter((p) => p.by === 'self').length

  const stats: Stat[] = [
    {
      label: 'Tracked',
      value: study.tracked,
      note: `of ${plural(study.people, 'participant', 'participants')}`,
      icon: 'signal',
      tone: 'green',
    },
    {
      label: 'Tracking off',
      value: study.trackingOff,
      note: offBySelf === study.trackingOff ? 'Turned off by them' : `${offBySelf} by them, ${study.trackingOff - offBySelf} by an admin`,
      icon: 'off',
      tone: 'orange',
    },
    {
      label: 'Joined from the notice',
      value: study.notice.joined,
      note: `${plural(study.notice.shown, 'person', 'people')} saw it`,
      icon: 'bell',
      tone: 'blue',
    },
    {
      label: 'Books saved',
      value: study.booksSaved,
      note: 'By tracked people',
      icon: 'book',
      tone: 'green',
    },
  ]

  return (
    <section className="st-detail">
      <div className="st-detail-head">
        <span className={study.running ? 'st-badge is-running' : 'st-badge'}>
          <StudyIcon name="flask" size={24} />
        </span>
        <div className="st-detail-title">
          <span className="st-detail-name">
            <strong>Study {study.number}</strong>
            <span className={study.running ? 'st-pill is-running' : 'st-pill'}>
              {study.running && <i aria-hidden="true" />}
              {study.running ? 'Running' : 'Ended'}
            </span>
          </span>
          <span className="st-detail-when">
            <StudyIcon name="calendar" size={14} />
            {study.running ? (
              <>
                Switched on {fullDateTime(study.startedAt)}, running {plural(study.days, 'day', 'days')}
              </>
            ) : (
              <>
                {fullDateTime(study.startedAt)} to {fullDateTime(study.endedAt!)}, {plural(study.days, 'day', 'days')}
              </>
            )}
          </span>
        </div>
      </div>

      <div className="st-stats">
        {stats.map((s) => (
          <div key={s.label} className="st-stat">
            <span className="st-stat-label">
              <span className={`st-stat-icon is-${s.tone}`}>
                <StudyIcon name={s.icon} size={15} />
              </span>
              {s.label}
            </span>
            <span className="st-stat-value">{s.value.toLocaleString()}</span>
            <span className="st-stat-note">{s.note}</span>
          </div>
        ))}
      </div>

      <div className="st-off">
        <div className="st-off-head">
          <strong>Tracking off: research IDs</strong>
          <button type="button" className="link-button" onClick={onOpenParticipants}>
            See in Participants
          </button>
        </div>
        <OffIdList people={study.offIds} />
      </div>

      <div className="st-links">
        <button type="button" className="st-button" onClick={onOpenParticipants}>
          <StudyIcon name="users" size={16} />
          See participants
        </button>
        <button type="button" className="st-button" onClick={onOpenData}>
          <StudyIcon name="table" size={16} />
          See the data in All Data
        </button>
      </div>
    </section>
  )
}