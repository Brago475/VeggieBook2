import { useState } from 'react'
import type { MatchResult } from '../types'

// Runs the matching engine. POST, not GET: the selected attributes go in
// the body as an array.

export function useMatch() {
  const [result, setResult] = useState<MatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  async function run(vegetableCode: string, attributes: string[]) {
    setRunning(true)
    setError(null)
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vegetable: vegetableCode,
          attributes,
          lang: 'en',
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setResult(await res.json())
    } catch (err) {
      setError(String(err))
    } finally {
      setRunning(false)
    }
  }

  function reset() {
    setResult(null)
    setError(null)
  }

  return { result, error, running, run, reset }
}