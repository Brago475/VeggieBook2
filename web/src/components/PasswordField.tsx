import { useId, useState } from 'react'
import { EyeIcon, EyeOffIcon } from './AccountIcons'

// A password input for the account screen cards.
//
// By default it has an eye button to show or hide what was typed. The
// button says what it will do ("Show password" / "Hide password") to screen
// readers, since the eye alone is only a picture.
//
// For the current password, use reveal={false} and noAutofill. Otherwise a
// browser fills in the saved password on its own, and anyone at an unlocked
// computer could press the eye and read it. noAutofill keeps the box read
// only until it is clicked, which browsers skip when filling a page. A
// password manager can still fill it when the person picks it.

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: 'current-password' | 'new-password' | 'off'
  id?: string
  placeholder?: string
  hint?: string
  autoFocus?: boolean
  reveal?: boolean
  noAutofill?: boolean
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
  reveal = true,
  noAutofill = false,
}: Props) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  const [shown, setShown] = useState(false)
  const [locked, setLocked] = useState(noAutofill)

  return (
    <div className="field">
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>

      <div className="field-wrap">
        <input
          id={inputId}
          className={reveal ? 'field-input has-icon' : 'field-input'}
          type={reveal && shown ? 'text' : 'password'}
          autoComplete={autoComplete}
          maxLength={128}
          placeholder={placeholder}
          value={value}
          readOnly={locked}
          onFocus={() => setLocked(false)}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={hint ? hintId : undefined}
          autoFocus={autoFocus}
        />
        {reveal && (
          <button
            type="button"
            className="field-icon-btn"
            aria-label={shown ? 'Hide password' : 'Show password'}
            aria-pressed={shown}
            onClick={() => setShown((s) => !s)}
          >
            {shown ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>

      {hint && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  )
}