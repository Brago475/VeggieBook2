import type { SheetRow } from '../types/research'

// Small display helpers for the All Data page. The data itself keeps the
// plain forms (2026-10-09, 15:58) so the downloads sort and import cleanly.

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// 2026-10-09 to Oct 9
export function shortDate(value: unknown): string {
  if (typeof value !== 'string') return ''
  const [, m, d] = value.split('-').map(Number)
  if (!m || !d) return value
  return `${months[m - 1]} ${d}`
}

// 15:58 to 3:58 PM
export function shortTime(value: unknown): string {
  if (typeof value !== 'string') return ''
  const [h, m] = value.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return value
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

// Friday to Fri
export function shortDay(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 3) : ''
}

// One key per book, shared by both files.
export function bookKey(row: SheetRow): string {
  return `${row.participant_id}#${row.book_no}`
}

export function isSecrets(row: SheetRow): boolean {
  return row.book_type === 'Secrets Book'
}

// Broccoli VeggieBook, or Shopping Secrets Book.
export function bookTitle(row: SheetRow): string {
  if (isSecrets(row)) return `${row.secrets_category ?? 'Secrets'} Book`
  return `${row.vegetable ?? 'Unknown'} VeggieBook`
}

// The vegetable for a VeggieBook, the category for a Secrets Book.
export function bookSubject(row: SheetRow): string {
  return String((isSecrets(row) ? row.secrets_category : row.vegetable) ?? '')
}

export function dateRange(rows: SheetRow[]): string {
  const dates = rows
    .map((r) => r.date)
    .filter((d): d is string => typeof d === 'string')
    .sort()
  if (dates.length === 0) return 'n/a'
  const first = shortDate(dates[0])
  const last = shortDate(dates[dates.length - 1])
  return first === last ? first : `${first} to ${last}`
}