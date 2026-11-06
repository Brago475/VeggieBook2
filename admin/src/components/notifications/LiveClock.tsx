import { useNow } from '../../hooks/useNow'

// The current time with a pulsing dot, so start times are never judged
// against a clock that stopped when the page opened.

export function LiveClock() {
  const now = useNow(1000)
  const text = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  })

  return (
    <span className="nt-clock">
      <i aria-hidden="true" />
      Now {text}
    </span>
  )
}