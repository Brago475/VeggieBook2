import { useEffect, useState } from 'react'

// First-load screen phases. The screen stays at least SPLASH_MIN_VISIBLE_MS
// from page start so it never flashes, then leaves as soon as the app is
// ready: the bar sweeps to full, then the screen fades out.

export type SplashPhase = 'showing' | 'leaving' | 'gone'

export const SPLASH_MIN_VISIBLE_MS = 600
export const SPLASH_FINISH_MS = 300
export const SPLASH_FADE_MS = 350

export function useSplash(ready: boolean): SplashPhase {
  const [phase, setPhase] = useState<SplashPhase>('showing')

  useEffect(() => {
    if (!ready || phase !== 'showing') return
    const wait = Math.max(0, SPLASH_MIN_VISIBLE_MS - performance.now())
    const t = window.setTimeout(() => setPhase('leaving'), wait)
    return () => window.clearTimeout(t)
  }, [ready, phase])

  useEffect(() => {
    if (phase !== 'leaving') return
    const t = window.setTimeout(
      () => setPhase('gone'),
      SPLASH_FINISH_MS + SPLASH_FADE_MS,
    )
    return () => window.clearTimeout(t)
  }, [phase])

  return phase
}