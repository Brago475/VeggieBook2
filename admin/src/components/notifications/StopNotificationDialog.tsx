import { useEffect, useState } from 'react'
import type { AdminNotification } from '../../types/notifications'
import { StudyIcon } from '../studies/StudyIcons'

// The check before a notification is stopped, in the same orange style as
// switching a study off. Closes on Cancel, the X, Escape, or a click outside.

type Props = {
  item: AdminNotification
  onStop: () => Promise<string | null>
  onClose: () => void
}

export function StopNotificationDialog({ item, onStop, onClose }: Props) {
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
    const message = await onStop()
    setBusy(false)
    if (message) setError(message)
    else onClose()
  }

  return (
    <div className="st-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="st-dialog" role="alertdialog" aria-modal="true" aria-labelledby="ns-title">
        <div className="st-dialog-head is-stop">
          <span className="st-dialog-icon">
            <StudyIcon name="stop" size={20} />
          </span>
          <div className="st-dialog-title">
            <strong id="ns-title">Stop notification #{item.id}?</strong>
            <span className="nt-dialog-excerpt">{item.bodyEn}</span>
          </div>
          <button type="button" className="st-dialog-close" aria-label="Close" disabled={busy} onClick={onClose}>
            <StudyIcon name="close" size={16} />
          </button>
        </div>

        <div className="st-dialog-body">
          <div className="st-dialog-tiles">
            <div className="st-tile is-orange">
              <span className="st-tile-label">Leaves the app</span>
              <span className="st-tile-note">
                It disappears from the pop-up and the Notifications menu right away, and can't be edited afterward.
              </span>
            </div>
            <div className="st-tile is-green">
              <span className="st-tile-label">Kept</span>
              <span className="st-tile-note">
                Who saw, opened, or closed it stays recorded. Use Send again to show it later.
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
              <StudyIcon name="stop" size={16} />
              {busy ? 'Stopping...' : 'Stop it'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}