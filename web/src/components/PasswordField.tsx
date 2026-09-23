import { useId, useState } from 'react'
import { EyeIcon, EyeOffIcon } from './AccountIcons'

// A password input with an eye button inside it to show or hide what was
// typed. Used by both cards on the account screen.
//
// The button says what it will do ("Show password" / "Hide password") to
// screen readers, since the eye alone is only a picture.

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: 'current-password' | 'new-password'
  id?: string
  placeholder?: string
  hint?: string
  autoFocus?: boolean
}

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  id,
  placeholder,
  hint,
  autoFocus,
}: Props) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const [shown, setShown] = useState(false)

  return (
    <div className="field">
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>

      <div className="field-wrap">
        <input
          id={inputId}
          className="field-input has-icon"
          type={shown ? 'text' : 'password'}
          autoComplete={autoComplete}
          maxLength={128}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={hint ? hintId : undefined}
          autoFocus={autoFocus}
        />
        <button
          type="button"
          className="field-icon-btn"
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown}
          onClick={() => setShown((s) => !s)}
        >
          {shown ? <EyeOffIcon /> : <EyeIcon />}
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