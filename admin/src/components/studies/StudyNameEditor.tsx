import { useEffect, useRef, useState } from 'react'
import type { StudySummary } from '../../types/studies'
import { StudyIcon } from './StudyIcons'

// Renames a study in place: a text box with Save and Cancel. Enter saves,
// Escape cancels. Leaving it empty goes back to plain "Study N". The study's
// number never changes, so "Study 2" stays Study 2 in every file.

type Props = {
  study: StudySummary
  onSave: (name: string) => Promise<string | null>
  onDone: () => void
}

const MAX = 60

export function StudyNameEditor({ study, onSave, onDone }: Props) {
  const [value, setValue] = useState(study.name ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  async function save() {
    if (value.trim() === (study.name ?? '')) {
      onDone()
      return
    }
    setBusy(true)
    const message = await onSave(value.trim())
    setBusy(false)
    if (message) setError(message)
    else onDone()
  }

  return (
    <span className="se-edit">
      <input
        ref={inputRef}
        className="se-input"
        value={value}
        maxLength={MAX}
        placeholder={`Study ${study.number}`}
        aria-label={`Name for Study ${study.number}`}
        disabled={busy}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void save()
          if (e.key === 'Escape') onDone()
        }}
      />
      <button type="button" className="se-icon is-save" aria-label="Save name" disabled={busy} onClick={() => void save()}>
        <StudyIcon name="check" size={16} />
      </button>
      <button type="button" className="se-icon" aria-label="Cancel" disabled={busy} onClick={onDone}>
        <StudyIcon name="close" size={14} />
      </button>
      {error && (
        <span className="se-error" role="alert">
          {error}
        </span>
      )}
    </span>
  )
}