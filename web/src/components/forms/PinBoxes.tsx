import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { AUTH } from '../../i18n/strings/auth'
import { useStrings } from '../../i18n/useStrings'
import '../../styles/pin-boxes.css'

// Six-square PIN input. One invisible input covers the squares and handles
// typing, pasting, number pads, and screen readers; the squares only display it.
// The caret is kept at the end so Backspace always removes the last digit.

type Props = {
  id?: string
  value: string
  onChange: (value: string) => void
  describedBy?: string
  autoFocus?: boolean
}

export function PinBoxes({ id, value, onChange, describedBy, autoFocus }: Props) {
  const t = useStrings(AUTH)
  const generatedId = useId()
  const inputId = id ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const [shown, setShown] = useState(false)

  const digits = value.split('')
  const next = Math.min(value.length, 5)

  function caretToEnd() {
    const el = inputRef.current
    if (!el) return
    const end = el.value.length
    if (el.selectionStart !== end || el.selectionEnd !== end) {
      el.setSelectionRange(end, end)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      if (value) onChange(value.slice(0, -1))
    }
  }

  function clear() {
    onChange('')
    inputRef.current?.focus()
  }

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
          onKeyDown={handleKeyDown}
          onClick={caretToEnd}
          onSelect={caretToEnd}
          onFocus={() => {
            setFocused(true)
            requestAnimationFrame(caretToEnd)
          }}
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
      <div className="pin-boxes-actions">
        <button
          type="button"
          className="pin-boxes-toggle"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          aria-controls={inputId}
        >
          {shown ? t.pinHide : t.pinShow}
        </button>
        <button
          type="button"
          className="pin-boxes-toggle"
          onClick={clear}
          disabled={value.length === 0}
          aria-controls={inputId}
        >
          {t.pinClear}
        </button>
      </div>
    </div>
  )
}