import { useEffect, useState } from 'react'
import { api } from '../utils/api'
import { exportQuery, type ExportParams } from '../utils/exportQuery'

// Counts for the chosen data (GET /api/admin/export/summary). Pass null to
// skip loading. Requests wait briefly while filters change, and a stale
// answer is never shown.

export type ExportSummary = {
  books: number
  veggieBooks: number
  secretsBooks: number
  participants: number
  items: number
  from: string | null
  to: string | null
}

type Result = { query: string; data: ExportSummary | null; error: string | null }

const WAIT_MS = 250

export function useExportSummary(params: ExportParams | null) {
  const query = params ? exportQuery(params) : null
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    if (query === null) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      api<ExportSummary>(`/admin/export/summary${query}`)
        .then((data) => {
          if (!cancelled) setResult({ query, data, error: null })
        })
        .catch((err: Error) => {
          if (!cancelled) setResult({ query, data: null, error: err.message })
        })
    }, WAIT_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query])

  const current = query !== null && result?.query === query ? result : null
  return {
    summary: current?.data ?? null,
    error: current?.error ?? null,
    loading: query !== null && current === null,
  }
}