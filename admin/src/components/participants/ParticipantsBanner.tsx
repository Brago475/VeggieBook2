import type { ReactNode } from 'react'
import type { ParticipantsResponse } from '../../types/participants'
import { StudyIcon } from '../studies/StudyIcons'
import { fullDate, studyTitle } from '../studies/studyFormat'
import { PeopleStack } from './PeopleStack'

// The strip at the top of the Participants page.
//
//   Top      the study running now (or that none is), the people stack with
//            how many are tracked, and Manage in Studies
//   Bottom   the status tabs and search, passed in as children

type Props = {
  data: ParticipantsResponse
  onOpenStudies: () => void
  children: ReactNode
}

export function ParticipantsBanner({ data, onOpenStudies, children }: Props) {
  const { study, counts, people } = data

  return (
    <section className="pt-summary">
      <div className="pt-summary-top">
        <span className={study ? 'st-badge is-running' : 'st-badge'}>
          <StudyIcon name="flask" size={20} />
        </span>

        <div className="pt-summary-title">
          {study ? (
            <>
              <strong>{studyTitle(study)}</strong>
              <span className="st-pill is-running">
                <i />
                Running
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

        <PeopleStack people={people} counts={counts} />
        <span className="pt-summary-divider" aria-hidden="true" />

        <button type="button" className="st-button pt-summary-link" onClick={onOpenStudies}>
          Manage in Studies
        </button>
      </div>

      <div className="pt-summary-filters">{children}</div>
    </section>
  )
}