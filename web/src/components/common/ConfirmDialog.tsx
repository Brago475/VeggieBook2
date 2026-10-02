import { useEffect, useRef } from 'react'

// A yes-or-no question, asked the same way everywhere.
//
// Replaces window.confirm, which the browser draws in its own style and
// cannot be themed.
//
// Built from a div rather than <dialog>. The native element would give
// focus trapping and Escape for free, but it needs iOS 15.4 or newer, and
// this app is aimed at people on phones they have had for a while.
//
// Focus lands on the safe option, not the destructive one, so a stray tap
// or a held Return key cannot delete anything.

type Props = {
  open: boolean
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Draws the confirming action in the danger color. */
  danger?: boolean
  /** Disables both buttons while the action is in flight. */
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Yes',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    cancelRef.current?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)

    // Stops the page behind from scrolling under the dialog on a phone.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={body ? 'dialog-body' : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="dialog-title" id="dialog-title">
          {title}
        </h2>
        {body && (
          <p className="dialog-body" id="dialog-body">
            {body}
          </p>
        )}

        {/* The destructive action sits above the way out, and the way out is
            what holds focus. */}
        <div className="dialog-actions">
          <button
            type="button"
            className={danger ? 'account-btn is-danger' : 'create-btn'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Please wait...' : confirmLabel}
          </button>
          <button
            ref={cancelRef}
            type="button"
            className="account-btn"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}