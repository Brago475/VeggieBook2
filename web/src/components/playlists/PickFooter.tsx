// Bar pinned to the bottom of the picker: Cancel as plain text, and the
// save button carrying the picked count.

type Props = {
  cancelLabel: string
  saveLabel: string
  busy: boolean
  onCancel: () => void
  onSave: () => void
}

export function PickFooter({ cancelLabel, saveLabel, busy, onCancel, onSave }: Props) {
  return (
    <div className="pk-foot">
      <button type="button" className="pk-cancel" disabled={busy} onClick={onCancel}>
        {cancelLabel}
      </button>
      <button type="button" className="pl-btn is-primary pk-save" disabled={busy} onClick={onSave}>
        {saveLabel}
      </button>
    </div>
  )
}