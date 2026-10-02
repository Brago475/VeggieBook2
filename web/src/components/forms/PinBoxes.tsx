import { useId, useRef, useState } from 'react'
import '../../styles/pin-boxes.css'

// A 6-digit PIN shown as six small squares.
//
// Under the squares sits one real input, invisible but covering them, so
// typing, Backspace, pasting a whole PIN, phone number pads, and screen
// readers all work like a normal box. The squares only draw what is in it:
// a dot per digit (or the digit, after Show), and an outline on the next
// square to fill.

type Props = {
  id?: string
  value: string
  onChange: (value: string) => void
  describedBy?: string
  autoFocus?: boolean
}

export function PinBoxes({ id, value, onChange, describedBy, autoFocus }: Props) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const [shown, setShown] = useState(false)

  const digits = value.split('')
  const next = Math.min(value.length, 5)

  return (
    <div className="pin-boxes-row">
      <div className="pin-boxes" onClick={() => inputRef.current?.focus()}>
        <input
          ref={inputRef}
          id={inputId}
          className="pin-boxes-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-describedby={describedBy}
          autoFocus={autoFocus}
        />
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={
              'pin-box' +
              (digits[i] ? ' is-filled' : '') +
              (focused && i === next ? ' is-active' : '')
            }
          >
            {digits[i] ? (shown ? digits[i] : '•') : ''}
          </span>
        ))}
      </div>
      <button
        type="button"
        className="pin-boxes-toggle"
        onClick={() => setShown((s) => !s)}
        aria-pressed={shown}
        aria-controls={inputId}
      >
        {shown ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}