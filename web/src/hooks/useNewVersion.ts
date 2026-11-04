import { useEffect, useRef } from 'react'

// Reloads the page after a deploy, so open tabs never keep running old code.
//
// The running build's version is compiled in (vite.config.ts). The newest is
// in /version.json, checked when the tab comes back into view and every few
// minutes. When it differs, the page reloads on the next move to a screen
// where nothing is lost (safe), never in the middle of something.
//
// A version is reloaded for once per tab, so a stale cache can never cause
// a reload loop. Does nothing in development.

const CHECK_MS = 5 * 60 * 1000
const RELOADED_KEY = 'vb-reloaded-for'

export function useNewVersion(path: string, safe: boolean) {
  const newer = useRef<string | null>(null)

  useEffect(() => {
    if (import.meta.env.DEV) return
    let stopped = false

    async function check() {
      try {
        const res = await fetch('/version.json', { cache: 'no-store' })
        if (!res.ok) return
        const data: unknown = await res.json()
        const latest =
          data && typeof data === 'object' && 'version' in data
            ? (data as { version: unknown }).version
            : null
        if (stopped || typeof latest !== 'string' || latest === __APP_VERSION__) return
        if (readReloaded() === latest) return
        newer.current = latest
      } catch {
        // Offline or a bad response: try again on the next check.
      }
    }

    function onVisible() {
      if (document.visibilityState === 'visible') void check()
    }

    void check()
    const timer = window.setInterval(check, CHECK_MS)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      stopped = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [])

  useEffect(() => {
    const latest = newer.current
    if (!latest || !safe) return
    writeReloaded(latest)
    window.location.reload()
  }, [path, safe])
}

function readReloaded(): string | null {
  try {
    return window.sessionStorage.getItem(RELOADED_KEY)
  } catch {
    return null
  }
}

function writeReloaded(version: string) {
  try {
    window.sessionStorage.setItem(RELOADED_KEY, version)
  } catch {
    // Storage blocked: the version check still stops after one reload,
    // since the reloaded page runs the new version.
  }
}