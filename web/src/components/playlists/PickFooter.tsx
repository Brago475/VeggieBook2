// Bar pinned to the bottom of the picker: the picked count, Cancel, and
// the save button.

type Props = {
  countLabel: string
  cancelLabel: string
  saveLabel: string
  busy: boolean
  onCancel: () => void
  onSave: () => void
}

export function PickFooter({ countLabel, cancelLabel, saveLabel, busy, onCancel, onSave }: Props) {
  return (
    <div className="pk-foot">
      <span className="pk-foot-count" aria-live="polite">
        {countLabel}
      </span>
      <div className="pk-foot-btns">
        <button type="button" className="pl-btn" disabled={busy} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className="pl-btn is-primary" disabled={busy} onClick={onSave}>
          {saveLabel}
        </button>
      </div>
    </div>
  )
}