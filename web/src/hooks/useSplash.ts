import { useEffect, useState } from 'react'

// First-load screen phases: shown until the app is ready and the bar has
// filled, then faded out, then removed.

export type SplashPhase = 'showing' | 'leaving' | 'gone'

// Must match the 2.6s cycle in index.html. The bar is full from 80% on.
const CYCLE_MS = 2600
const FULL_AT_MS = 2100
export const SPLASH_FADE_MS = 350

export function useSplash(ready: boolean): SplashPhase {
  const [phase, setPhase] = useState<SplashPhase>('showing')

  useEffect(() => {
    if (!ready || phase !== 'showing') return
    const pos = performance.now() % CYCLE_MS
    const wait = pos >= FULL_AT_MS ? 0 : FULL_AT_MS - pos
    const t = window.setTimeout(() => setPhase('leaving'), wait)
    return () => window.clearTimeout(t)
  }, [ready, phase])

  useEffect(() => {
    if (phase !== 'leaving') return
    const t = window.setTimeout(() => setPhase('gone'), SPLASH_FADE_MS)
    return () => window.clearTimeout(t)
  }, [phase])

  return phase
}