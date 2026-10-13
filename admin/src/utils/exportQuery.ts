// Query strings and download links for All Data and Export
// (api/Admin/ExportQuery.cs). Empty values are left out.

export type ExportParams = {
  study?: number | null
  answers?: boolean
  participant?: string
  book?: number | null
  category?: number | null
  vegetable?: string
  from?: string
  to?: string
  age?: string
  recipes?: number[]
  secrets?: number[]
}

export function exportQuery(p: ExportParams, extra: Record<string, string> = {}): string {
  const s = new URLSearchParams()
  if (p.study != null) s.set('study', String(p.study))
  if (p.answers) s.set('answers', 'true')
  if (p.participant) s.set('participant', p.participant)
  if (p.book != null) s.set('book', String(p.book))
  if (p.category != null) s.set('category', String(p.category))
  if (p.vegetable) s.set('vegetable', p.vegetable)
  if (p.from) s.set('from', p.from)
  if (p.to) s.set('to', p.to)
  if (p.age) s.set('age', p.age)
  if (p.recipes?.length) s.set('recipes', p.recipes.join(','))
  if (p.secrets?.length) s.set('secrets', p.secrets.join(','))
  for (const [key, value] of Object.entries(extra)) s.set(key, value)
  const text = s.toString()
  return text ? `?${text}` : ''
}

// For plain download links.
export function exportUrl(path: string, p: ExportParams = {}, extra?: Record<string, string>): string {
  return `/api/admin/${path}${exportQuery(p, extra)}`
}

// "2026-10-11" as "Oct 11, 2026", read as a local calendar day.
export function shortDay(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}