import type { ReactNode } from 'react'

// A plain text box in the rounded pill style of the account screens: names,
// username, confirm email, and the security answer.

type Props = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  icon?: ReactNode
  type?: 'text' | 'email'
  autoComplete?: string
  autoCapitalize?: string
  maxLength?: number
  hint?: ReactNode
  required?: boolean
}

export function TextPillField({
  id,
  label,
  value,
  onChange,
  icon,
  type = 'text',
  autoComplete,
  autoCapitalize,
  maxLength = 100,
  hint,
  required = true,
}: Props) {
  const hintId = `${id}-hint`

  return (
    <div className="pill-field">
      <label className="pill-label" htmlFor={id}>
        {label}
      </label>
      <div className="pill-wrap">
        {icon}
        <input
          id={id}
          className={icon ? 'pill-input' : 'pill-input no-icon'}
          type={type}
          inputMode={type === 'email' ? 'email' : undefined}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          spellCheck={false}
          maxLength={maxLength}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={hint ? hintId : undefined}
        />
      </div>
      {hint && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  )
}