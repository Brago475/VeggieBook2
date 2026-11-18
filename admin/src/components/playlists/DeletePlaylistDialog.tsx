import { useEffect, useState } from 'react'
import type { PlaylistSummary } from '../../types/playlists'
import { StudyIcon } from '../studies/StudyIcons'

// Asks before deleting a playlist that was never sent, kept or skipped.
// Closes on Cancel, the X, Escape, or a click outside.

type Props = {
  playlist: PlaylistSummary
  onDelete: () => Promise<string | null>
  onClose: () => void
}

export function DeletePlaylistDialog({ playlist, onDelete, onClose }: Props) {
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
    setError(null)
    const message = await onDelete()
    setBusy(false)
    if (message) setError(message)
  }

  return (
    <div className="st-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="st-dialog" role="alertdialog" aria-modal="true" aria-labelledby="pl-delete-title">
        <div className="st-dialog-head">
          <div className="st-dialog-title">
            <strong id="pl-delete-title">Delete "{playlist.nameEn}"?</strong>
            <span>This can't be undone.</span>
          </div>
          <button type="button" className="st-dialog-close" aria-label="Close" disabled={busy} onClick={onClose}>
            <StudyIcon name="close" size={16} />
          </button>
        </div>

        <div className="st-dialog-body">
          <p className="st-muted">
            It was never sent and nobody has kept or skipped it, so deleting it removes it for good. The Activity log
            keeps a line with its name and who deleted it.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="st-dialog-actions">
          <button type="button" className="st-button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="st-button is-orange" disabled={busy} onClick={() => void confirm()}>
            {busy ? 'Deleting...' : 'Delete playlist'}
          </button>
        </div>
      </div>
    </div>
  )
}