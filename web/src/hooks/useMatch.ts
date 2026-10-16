import { useCallback, useEffect, useRef, useState } from 'react'
import type { Lang } from '../i18n/language'
import { useLang } from '../i18n/languageContext'
import type { MatchResult } from '../types'

// Runs the matching engine in the current language. POST, not GET: the
// selected attributes go in the body as an array.
//
// A language change re-runs the last match quietly, so the same recipes
// come back in the same order, now in the new language.
//
// restore() puts back a result saved before a refresh, so the same recipes
// come back in the same order without asking the server again.

type Request = { vegetableCode: string; attributes: string[]; lang: Lang }

async function fetchMatch(req: Request): Promise<MatchResult> {
  const res = await fetch('/api/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vegetable: req.vegetableCode,
      attributes: req.attributes,
      lang: req.lang,
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function useMatch() {
  const { lang } = useLang()
  const [result, setResult] = useState<MatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  const last = useRef<Request | null>(null)
  const seq = useRef(0)

  // quiet skips the running flag, so a language re-run does not flash a
  // loading screen.
  const request = useCallback(async (req: Request, quiet: boolean) => {
    const id = ++seq.current
    last.current = req
    if (!quiet) setRunning(true)
    setError(null)
    try {
      const data = await fetchMatch(req)
      if (id === seq.current) setResult(data)
    } catch (err) {
      if (id === seq.current) setError(String(err))
    } finally {
      if (id === seq.current && !quiet) setRunning(false)
    }
  }, [])

  async function run(vegetableCode: string, attributes: string[]) {
    await request({ vegetableCode, attributes, lang }, false)
  }

  useEffect(() => {
    const prev = last.current
    if (prev && prev.lang !== lang) void request({ ...prev, lang }, true)
  }, [lang, request])

  function restore(saved: MatchResult) {
    seq.current++
    last.current = null
    setResult(saved)
    setError(null)
    setRunning(false)
  }

  function reset() {
    seq.current++
    last.current = null
    setResult(null)
    setError(null)
  }

  return { result, error, running, run, restore, reset }
}