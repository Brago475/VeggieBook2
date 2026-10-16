import type { ParticipantsResponse } from '../../types/participants'
import { StudyIcon } from '../studies/StudyIcons'
import { fullDate, studyTitle } from '../studies/studyFormat'

// The strip at the top of the Participants page: the study running now (or
// that none is), how many people are tracked out of everyone, a bar for
// that share, the three counts, and a link to the Studies page.

type Props = {
  data: ParticipantsResponse
  onOpenStudies: () => void
}

export function ParticipantsBanner({ data, onOpenStudies }: Props) {
  const { study, counts } = data
  const share = counts.all === 0 ? 0 : Math.round((counts.on / counts.all) * 100)

  return (
    <section className="pt-summary">
      <div className="pt-summary-study">
        <span className={study ? 'st-badge is-running' : 'st-badge'}>
          <StudyIcon name="flask" size={22} />
        </span>
        <div className="pt-summary-title">
          {study ? (
            <>
              <span className="pt-summary-name">
                <strong>{studyTitle(study)}</strong>
                <span className="st-pill is-running">
                  <i />
                  Running
                </span>
              </span>
              <span className="pt-summary-when">Started {fullDate(study.startedAt)}</span>
            </>
          ) : (
            <>
              <strong>No study running</strong>
              <span className="pt-summary-when">Tracked books still count in All Data.</span>
            </>
          )}
        </div>
      </div>

      <div className="pt-summary-share">
        <span className="pt-summary-big">
          <strong>
            {counts.on.toLocaleString()} of {counts.all.toLocaleString()}
          </strong>{' '}
          tracked
        </span>
        <span className="pt-bar" aria-hidden="true">
          <span style={{ width: `${share}%` }} />
        </span>
        <span className="pt-summary-pct">{share}%</span>
      </div>

      <ul className="pt-summary-counts">
        <li className="is-on">
          <i aria-hidden="true" />
          Tracking on <strong>{counts.on.toLocaleString()}</strong>
        </li>
        <li className="is-self">
          <i aria-hidden="true" />
          Turned off by them <strong>{counts.offSelf.toLocaleString()}</strong>
        </li>
        <li className="is-admin">
          <i aria-hidden="true" />
          Turned off by an admin <strong>{counts.offAdmin.toLocaleString()}</strong>
        </li>
      </ul>

      <button type="button" className="st-button pt-summary-link" onClick={onOpenStudies}>
        Manage in Studies
      </button>
    </section>
  )
}