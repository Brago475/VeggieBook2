import { useEffect, useState } from 'react'
import { apiFetch } from '../utils/api'

// Whether guest visits are turned on (GET /api/settings). Null until the
// answer arrives. If the check fails, guests are shown as allowed; the API
// still refuses a guest visit when they are off.

type PublicSettings = { guestsAllowed: boolean }

export function useGuestsAllowed(): boolean | null {
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch<PublicSettings>('/settings')
      .then((s) => {
        if (!cancelled) setAllowed(s.guestsAllowed !== false)
      })
      .catch(() => {
        if (!cancelled) setAllowed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return allowed
}