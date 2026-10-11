import { useEffect, useRef, useState } from 'react'
import type { StudySummary } from '../../types/studies'
import { StudyIcon } from './StudyIcons'
import { plural, studyFullTitle, studyRangeTimes, studyTitle } from './studyFormat'

// The warning before a study is deleted. It says which study and which
// stretch of time is being deleted, what goes and what stays, and asks the
// admin to type the study's name to confirm.
//
//   Removed   the study, its dates, and its notice answers: it leaves the
//             timeline, the study list, and the study picker on All Data
//   Kept      every book people saved (still in All Data under All data),
//             and everyone's tracking choice
//
// Only ended studies can be deleted; the server refuses a running one too.
// Closes on Cancel, Escape, or a click outside it.

type Props = {
  study: StudySummary
  onDelete: (confirm: string) => Promise<string | null>
  onClose: () => void
}

export function DeleteStudyDialog({ study, onDelete, onClose }: Props) {
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const title = studyTitle(study)
  const matches = typed.trim().toLowerCase() === title.toLowerCase()

  useEffect(() => {
    inputRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  async function confirm() {
    if (!matches) return
    setBusy(true)
    const message = await onDelete(typed.trim())
    setBusy(false)
    if (message) setError(message)
    else onClose()
  }

  return (
    <div className="st-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="st-dialog" role="alertdialog" aria-modal="true" aria-labelledby="sd-title" aria-describedby="sd-warning">
        <div className="st-dialog-head sd-head">
          <span className="st-dialog-icon sd-icon">
            <StudyIcon name="trash" size={20} />
          </span>
          <div className="st-dialog-title">
            <strong id="sd-title">Delete {studyFullTitle(study)}?</strong>
            <span>{studyRangeTimes(study.startedAt, study.endedAt)}</span>
          </div>
        </div>

        <div className="st-dialog-body">
          <p id="sd-warning" className="sd-warning">
            <StudyIcon name="alert" size={18} />
            <span>
              The study for this whole stretch of time will be deleted. It can't be undone.
            </span>
          </p>

          <div className="st-dialog-tiles">
            <div className="st-tile sd-removed">
              <span className="st-tile-label">Removed</span>
              <span className="st-tile-note">
                The study, its dates, and its notice answers
                {study.notice.shown > 0 ? ` (${plural(study.notice.shown, 'person', 'people')} saw it)` : ''}. It
                leaves the timeline and the study list in All Data.
              </span>
            </div>
            <div className="st-tile is-green">
              <span className="st-tile-label">Kept</span>
              <span className="st-tile-note">
                Every book people saved ({plural(study.booksSaved, 'book', 'books')} in this study). They stay in All
                Data under All data. No one's tracking changes.
              </span>
            </div>
          </div>

          <label className="sd-confirm">
            <span>
              Type <strong>{title}</strong> to confirm
            </span>
            <input
              ref={inputRef}
              value={typed}
              disabled={busy}
              autoComplete="off"
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void confirm()
              }}
            />
          </label>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <div className="st-dialog-actions">
            <button type="button" className="st-button" disabled={busy} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="st-button is-red"
              disabled={busy || !matches}
              onClick={() => void confirm()}
            >
              <StudyIcon name="trash" size={16} />
              {busy ? 'Deleting...' : `Delete ${title}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}