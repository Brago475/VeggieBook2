import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { AdminNotification } from '../../types/notifications'
import { StudyIcon } from '../studies/StudyIcons'
import { MAX_TITLE } from './notificationFormat'
import '../../styles/notification-names.css'

// Adds or changes a notification's title, in any status, stopped included.
// An empty title removes it. Closes on Cancel, the X, Escape, or a click
// outside.

type Props = {
  item: AdminNotification
  onSave: (title: string | null) => Promise<string | null>
  onClose: () => void
}

export function RenameNotificationDialog({ item, onSave, onClose }: Props) {
  const [title, setTitle] = useState(item.title ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const text = title.trim()
    if (text.length > MAX_TITLE) {
      setError(`Keep the title to ${MAX_TITLE} characters or fewer.`)
      return
    }
    setBusy(true)
    setError(null)
    const message = await onSave(text || null)
    setBusy(false)
    if (message) setError(message)
    else onClose()
  }

  return (
    <div className="st-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form className="st-dialog" role="dialog" aria-modal="true" aria-labelledby="nr-title" onSubmit={submit} noValidate>
        <div className="st-dialog-head">
          <span className="st-dialog-icon">
            <StudyIcon name="bell" size={20} />
          </span>
          <div className="st-dialog-title">
            <strong id="nr-title">{item.title ? 'Rename notification' : 'Add a title'}</strong>
            <span className="nt-dialog-excerpt">{item.bodyEn}</span>
          </div>
          <button type="button" className="st-dialog-close" aria-label="Close" disabled={busy} onClick={onClose}>
            <StudyIcon name="close" size={16} />
          </button>
        </div>

        <div className="st-dialog-body">
          <label className="nt-field">
            <span className="nt-label">Title</span>
            <input
              ref={inputRef}
              className="nt-input"
              maxLength={MAX_TITLE}
              value={title}
              placeholder="For example: Cucumber season, fall 2026"
              onChange={(e) => setTitle(e.target.value)}
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
            <button type="submit" className="st-button is-green" disabled={busy}>
              <StudyIcon name="check" size={16} />
              {busy ? 'Saving...' : 'Save title'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}