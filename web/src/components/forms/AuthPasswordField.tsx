import { useState, type ReactNode } from 'react'
import { EyeIcon, LockIcon } from '../icons/AuthIcons'

// The password box on the sign-in screens (sign in, create account, reset
// password), in the rounded pill style those screens use. The account
// screen has its own, PasswordField, in the card style.
//
// autoComplete matters: "current-password" lets password managers fill in a
// saved password, and "new-password" lets them suggest a strong one.

type Props = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: 'new-password' | 'current-password'
  hint?: ReactNode
}

export function AuthPasswordField({ id, label, value, onChange, autoComplete, hint }: Props) {
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
          className="pill-input has-action"
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          maxLength={128}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={hint ? hintId : undefined}
        />
        <button
          type="button"
          className="pill-action"
          onClick={() => setShow((v) => !v)}
          aria-pressed={show}
          aria-controls={id}
          aria-label={show ? 'Hide password' : 'Show password'}
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