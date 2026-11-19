import { useEffect, useState } from 'react'

// Steps through count slides every intervalMs, starting after delayMs.
// Holds on the first slide with reduced motion or fewer than two slides.

export function useSlideshow(count: number, intervalMs: number, delayMs = 0): number {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (count < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let interval: number | undefined
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => setShown((i) => (i + 1) % count), intervalMs)
    }, delayMs)
    return () => {
      window.clearTimeout(start)
      if (interval !== undefined) window.clearInterval(interval)
    }
  }, [count, intervalMs, delayMs])

  return count > 0 ? shown % count : 0
}