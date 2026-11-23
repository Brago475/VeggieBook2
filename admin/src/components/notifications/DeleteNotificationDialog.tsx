import { useEffect, useState } from 'react'
import type { AdminNotification } from '../../types/notifications'
import { StudyIcon } from '../studies/StudyIcons'
import { notificationName } from './notificationFormat'

// The check before an ended or stopped notification is deleted, in the same
// orange style as stopping one. Closes on Cancel, the X, Escape, or a click
// outside.

type Props = {
  item: AdminNotification
  onDelete: () => Promise<string | null>
  onClose: () => void
}

function TrashIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  )
}

export function DeleteNotificationDialog({ item, onDelete, onClose }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  async function confirm() {
    setBusy(true)
    const message = await onDelete()
    setBusy(false)
    if (message) setError(message)
    else onClose()
  }

  return (
    <div className="st-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="st-dialog" role="alertdialog" aria-modal="true" aria-labelledby="nd-title">
        <div className="st-dialog-head is-stop">
          <span className="st-dialog-icon">
            <TrashIcon size={20} />
          </span>
          <div className="st-dialog-title">
            <strong id="nd-title">Delete {notificationName(item)}?</strong>
            <span className="nt-dialog-excerpt">{item.bodyEn}</span>
          </div>
          <button type="button" className="st-dialog-close" aria-label="Close" disabled={busy} onClick={onClose}>
            <StudyIcon name="close" size={16} />
          </button>
        </div>

        <div className="st-dialog-body">
          <div className="st-dialog-tiles">
            <div className="st-tile is-orange">
              <span className="st-tile-label">Leaves this list</span>
              <span className="st-tile-note">
                It is removed from Ended and stopped and can't be sent again from here. This can't be undone on the
                admin site.
              </span>
            </div>
            <div className="st-tile is-green">
              <span className="st-tile-label">Kept</span>
              <span className="st-tile-note">
                Who saw, opened, or closed it stays recorded, and its lines stay in the activity log.
              </span>
            </div>
          </div>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <div className="st-dialog-actions">
            <button type="button" className="st-button" disabled={busy} onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="st-button is-orange" disabled={busy} onClick={() => void confirm()}>
              <TrashIcon size={16} />
              {busy ? 'Deleting...' : 'Delete it'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}