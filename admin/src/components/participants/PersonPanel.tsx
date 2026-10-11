import { useState } from 'react'
import type { Participant } from '../../types/participants'
import type { StudySummary } from '../../types/studies'
import { StudyIcon } from '../studies/StudyIcons'
import { studyTitle } from '../studies/studyFormat'
import {
  booksLine,
  changeText,
  changeWhen,
  joinedText,
  noticeText,
  statusLabel,
} from './participantText'

// The side panel for the person picked on the Participants page.
//
//   Top        research ID and tracking status
//   Tracking   what their status means, and every change, oldest first
//   Study      whether the running study tracks them, and the notice
//   About      age range, join date, tracked books
//   Actions    See their data in All Data, and:
//                on          Turn off tracking for this person (asks first)
//                off_admin   Turn tracking back on (undoes an admin)
//                off_self    nothing: only they can turn it back on
//
// Research ID only; no name or email exists here.

type Props = {
  person: Participant
  study: StudySummary | null
  onSetTracking: (on: boolean) => Promise<string | null>
  onOpenData: () => void
  onClose: () => void
}

const explain: Record<Participant['status'], string> = {
  on: 'Their books are tracked. They can turn it off in Settings.',
  off_self:
    'They turned tracking off in Settings, so nothing they save is used for research. Only they can turn it back on. They see the notice when a study runs.',
  off_admin:
    'An admin turned tracking off, so nothing they save is used for research. They get no study notice. Only an admin can turn it back on.',
}

export function PersonPanel({ person, study, onSetTracking, onOpenData, onClose }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function change(on: boolean) {
    setBusy(true)
    setError(null)
    const message = await onSetTracking(on)
    setBusy(false)
    if (message) setError(message)
    else setConfirming(false)
  }

  const notice = noticeText(person)

  return (
    <aside className={`pt-panel is-${person.status}`} aria-label={`Research ID ${person.researchId}`}>
      <div className="pt-panel-head">
        <div className="pt-panel-id">
          <span>Research ID</span>
          <strong>{person.researchId}</strong>
        </div>
        <button type="button" className="st-dialog-close" aria-label="Close" onClick={onClose}>
          <StudyIcon name="close" size={16} />
        </button>
      </div>

      <div className="pt-panel-body">
        <section className="pt-section">
          <span className="pt-chip">
            <i aria-hidden="true" />
            {statusLabel[person.status]}
          </span>
          <p className="pt-explain">{explain[person.status]}</p>

          <ol className="pt-history">
            <li>
              <span className="pt-history-dot is-on" aria-hidden="true" />
              <span>
                <strong>Joined, tracking on by default</strong>
                <span>{joinedText(person)}</span>
              </span>
            </li>
            {person.changes.map((c) => (
              <li key={c.at}>
                <span className={c.on ? 'pt-history-dot is-on' : `pt-history-dot is-${c.by}`} aria-hidden="true" />
                <span>
                  <strong>{changeText(c)}</strong>
                  <span>{changeWhen(c)}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="pt-section">
          <span className="pt-section-title">Study</span>
          {study ? (
            <dl className="pt-facts">
              <div>
                <dt>{studyTitle(study)}</dt>
                <dd>{person.status === 'on' ? 'Tracked' : 'Not tracked'}</dd>
              </div>
              {person.status === 'off_self' && (
                <div>
                  <dt>Notice</dt>
                  <dd>{notice ?? "Hasn't seen it yet"}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="pt-explain">No study is running.</p>
          )}
        </section>

        <section className="pt-section">
          <span className="pt-section-title">About</span>
          <dl className="pt-facts">
            <div>
              <dt>Age range</dt>
              <dd>{person.ageRange ?? 'Not given'}</dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>{joinedText(person)}</dd>
            </div>
            <div>
              <dt>Tracked books</dt>
              <dd>
                {booksLine(person)}
                {person.books > 0 && (
                  <span className="pt-dd-note">
                    {person.veggieBooks} VeggieBook{person.veggieBooks === 1 ? '' : 's'}, {person.secretsBooks}{' '}
                    Secrets Book{person.secretsBooks === 1 ? '' : 's'}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className="pt-actions">
          <button type="button" className="st-button" onClick={onOpenData}>
            <StudyIcon name="table" size={16} />
            See their data in All Data
          </button>

          {person.status === 'on' && !confirming && (
            <button type="button" className="st-button is-orange" onClick={() => setConfirming(true)}>
              <StudyIcon name="off" size={16} />
              Turn off tracking for this person
            </button>
          )}

          {person.status === 'off_admin' && (
            <button type="button" className="st-button is-green" disabled={busy} onClick={() => void change(true)}>
              <StudyIcon name="signal" size={16} />
              {busy ? 'Working...' : 'Turn tracking back on'}
            </button>
          )}

          {person.status === 'off_self' && (
            <p className="pt-explain pt-locked">Only they can turn tracking back on, in Settings.</p>
          )}
        </div>

        {confirming && (
          <div className="pt-confirm" role="alertdialog" aria-labelledby="pt-confirm-title">
            <strong id="pt-confirm-title">Turn off tracking for {person.researchId}?</strong>
            <p>
              Starting now, nothing they save is used for research, and they get no study notice. Books they saved
              before stay. Only an admin can turn it back on.
            </p>
            <div className="pt-confirm-actions">
              <button type="button" className="st-button" disabled={busy} onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button type="button" className="st-button is-orange" disabled={busy} onClick={() => void change(false)}>
                {busy ? 'Working...' : 'Turn it off'}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}