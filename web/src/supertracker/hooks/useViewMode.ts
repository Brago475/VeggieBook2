import { useCallback, useEffect, useState } from 'react'

// The SuperTracker2 layout: app (a narrow column) or site (wide pages).
// The choice is remembered on this device. Screens narrower than WIDE
// always use the app layout.

export type ViewMode = 'app' | 'site'

const KEY = 'st2-view'
const WIDE = '(min-width: 900px)'

function readSaved(): ViewMode {
  try {
    return localStorage.getItem(KEY) === 'site' ? 'site' : 'app'
  } catch {
    return 'app'
  }
}

function isWide(): boolean {
  return window.matchMedia(WIDE).matches
}

export function useViewMode() {
  const [saved, setSaved] = useState<ViewMode>(readSaved)
  const [wide, setWide] = useState<boolean>(isWide)

  useEffect(() => {
    const query = window.matchMedia(WIDE)
    const onChange = () => setWide(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const choose = useCallback((mode: ViewMode) => {
    setSaved(mode)
    try {
      localStorage.setItem(KEY, mode)
    } catch {
      // Storage can be unavailable; the choice then lasts for this visit.
    }
  }, [])

  const mode: ViewMode = wide ? saved : 'app'
  return { mode, saved, canChoose: wide, choose }
}