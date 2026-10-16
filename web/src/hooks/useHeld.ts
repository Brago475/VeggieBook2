import { useEffect, useRef, useState } from 'react'

// Minimum time a skeleton stays up once shown, so a fast answer does not
// flash for a single frame.
export const SKELETON_MIN_MS = 300

// Returns true while active, and for at least minMs after active turns on.
export function useHeld(active: boolean, minMs: number = SKELETON_MIN_MS): boolean {
  const [holding, setHolding] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => {
    if (!active) return
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = [
      window.setTimeout(() => setHolding(true), 0),
      window.setTimeout(() => setHolding(false), minMs),
    ]
  }, [active, minMs])

  useEffect(() => {
    const list = timers
    return () => list.current.forEach((t) => window.clearTimeout(t))
  }, [])

  return active || holding
}