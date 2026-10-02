import { useState, type ReactNode } from 'react'
import { EyeIcon, LockIcon } from './AuthIcons'

// A 6-digit PIN box. Only digits can be typed, and it is hidden like a
// password unless the eye button shows it. Phones open the number pad.

type Props = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  hint?: ReactNode
}

export function PinField({ id, label, value, onChange, hint }: Props) {
  const [show, setShow] = useState(false)
  const hintId = `${id}-hint`

  return (
    <div className="pill-field">
      <label className="pill-label" htmlFor={id}>
        {label}
      </label>
      <div className="pill-wrap">
        <LockIcon />
        <input
          id={id}
          className="pill-input has-action pin-input"
          type={show ? 'text' : 'password'}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={6}
          required
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          aria-describedby={hint ? hintId : undefined}
        />
        <button
          type="button"
          className="pill-action"
          onClick={() => setShow((v) => !v)}
          aria-pressed={show}
          aria-controls={id}
          aria-label={show ? 'Hide PIN' : 'Show PIN'}
        >
          <EyeIcon off={show} />
        </button>
      </div>
      {hint && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  )
}