import type { ResearchFilters } from '../types/research'

// Query strings and download links for the All Data API. The filters are
// the same ones the Research page uses (dates, age range, vegetable).

function query(f: ResearchFilters, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams()
  if (f.from) params.set('from', f.from)
  if (f.to) params.set('to', f.to)
  if (f.age) params.set('age', f.age)
  if (f.vegetable) params.set('vegetable', f.vegetable)
  for (const [key, value] of Object.entries(extra)) params.set(key, value)
  const text = params.toString()
  return text ? `?${text}` : ''
}

// For api(), which adds /api in front.
export function allDataPath(path: string, f: ResearchFilters, extra?: Record<string, string>): string {
  return `/admin/all-data/${path}${query(f, extra)}`
}

// For plain download links.
export function allDataDownload(path: string, f: ResearchFilters, extra?: Record<string, string>): string {
  return `/api/admin/all-data/${path}${query(f, extra)}`
}