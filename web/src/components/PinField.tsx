import type { ReactNode } from 'react'
import { PinBoxes } from './PinBoxes'

// A labeled 6-digit PIN, drawn as six squares (PinBoxes).
//
//   variant "pill"  the sign-in screens: Create Account, Forgot password
//   variant "card"  the account settings cards

type Props = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  hint?: ReactNode
  variant?: 'pill' | 'card'
}

export function PinField({ id, label, value, onChange, hint, variant = 'pill' }: Props) {
  const hintId = `${id}-hint`
  const card = variant === 'card'

  return (
    <div className={card ? 'field' : 'pill-field'}>
      <label className={card ? 'field-label' : 'pill-label'} htmlFor={id}>
        {label}
      </label>
      <PinBoxes
        id={id}
        value={value}
        onChange={onChange}
        describedBy={hint ? hintId : undefined}
      />
      {hint && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  )
}