import { useEffect, useRef, useState } from 'react'

// Counts a number up to its target over a short time, easing out at the
// end. When the target changes later, it counts from where it was to the
// new value. Skips the animation for anyone who has reduce motion turned
// on in their system settings.

export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0)
  const shown = useRef(0)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const start = shown.current

    if (reduce || start === target) {
      shown.current = target
      setValue(target)
      return
    }

    let frame = 0
    const began = performance.now()

    function tick(now: number) {
      const progress = Math.min(1, (now - began) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = Math.round(start + (target - start) * eased)
      shown.current = next
      setValue(next)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}