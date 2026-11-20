// Bar pinned to the bottom of the picker and edit screens: Cancel and the
// save button as two equal pills on a soft fade, like the rest of the app.

type Props = {
  cancelLabel: string
  saveLabel: string
  busy: boolean
  onCancel: () => void
  onSave: () => void
}

export function PickFooter({ cancelLabel, saveLabel, busy, onCancel, onSave }: Props) {
  return (
    <div className="pl-savebar">
      <button type="button" className="pl-btn" disabled={busy} onClick={onCancel}>
        {cancelLabel}
      </button>
      <button type="button" className="pl-btn is-primary" disabled={busy} onClick={onSave}>
        {saveLabel}
      </button>
    </div>
  )
}