import { useEffect, useRef, useState } from 'react'
import { useCountUp } from '../../hooks/useCountUp'

// A hero number that counts up, and flashes and counts from the old value
// when it changes, the same as the Overview stat cards.

type Props = {
  label: string
  value: number | null
}

export function CountStat({ label, value }: Props) {
  const shown = useCountUp(value ?? 0)
  const [flash, setFlash] = useState(0)
  const previous = useRef<number | null>(null)

  useEffect(() => {
    if (value === null) return
    if (previous.current !== null && previous.current !== value) setFlash((n) => n + 1)
    previous.current = value
  }, [value])

  const classes = ['ex-count']
  if (flash > 0) classes.push(flash % 2 === 1 ? 'is-flash-a' : 'is-flash-b')

  return (
    <div>
      <dt>{label}</dt>
      <dd className={classes.join(' ')}>{value === null ? '...' : shown.toLocaleString()}</dd>
    </div>
  )
}