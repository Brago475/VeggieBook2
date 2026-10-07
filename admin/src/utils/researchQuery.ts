import type { ExportFormat, ResearchFilters, SheetName } from '../types/research'

// Turns the page's filters into the query string the research API reads.
// Participants only uses the age filter; the others are about books.

export const noFilters: ResearchFilters = { from: '', to: '', age: '', vegetable: '' }

export function researchQuery(sheet: SheetName, f: ResearchFilters): string {
  const params = new URLSearchParams()
  if (sheet === 'responses') {
    if (f.from) params.set('from', f.from)
    if (f.to) params.set('to', f.to)
    if (f.vegetable) params.set('vegetable', f.vegetable)
  }
  if (f.age) params.set('age', f.age)
  const query = params.toString()
  return query ? `?${query}` : ''
}

// A download link for the sheet, with the same filters as the page.
export function exportUrl(sheet: SheetName, format: ExportFormat, f: ResearchFilters): string {
  const query = researchQuery(sheet, f)
  return `/api/admin/research/export/${sheet}${query}${query ? '&' : '?'}format=${format}`
}

export function hasFilters(f: ResearchFilters): boolean {
  return Boolean(f.from || f.to || f.age || f.vegetable)
}