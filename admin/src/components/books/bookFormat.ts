import type { BookSummary } from '../../types/books'

// Words and dates for the Books page.

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "2026-10-11T15:14:00" (Eastern, no zone) to "Oct 11, 2026, 3:14 PM".
// Read straight from the text, so the admin's own time zone never shifts it.
export function savedText(savedAt: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(savedAt)
  if (!m) return savedAt
  const [, y, mo, d, h, mi] = m
  const hour = Number(h)
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${months[Number(mo) - 1]} ${Number(d)}, ${y}, ${h12}:${mi} ${hour < 12 ? 'AM' : 'PM'}`
}

export function languageText(language: string): string {
  return language === 'es' ? 'Spanish' : 'English'
}

export function kindText(book: Pick<BookSummary, 'kind'>): string {
  return book.kind === 'secrets' ? 'Secrets Book' : 'VeggieBook'
}

// "14 recipes kept" or "1 secret kept".
export function keptText(book: Pick<BookSummary, 'kind' | 'kept'>): string {
  const noun = book.kind === 'secrets' ? 'secret' : 'recipe'
  return `${book.kept} ${book.kept === 1 ? noun : `${noun}s`} kept`
}

export function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`
}

// "recipe" or "recipes", "secret" or "secrets", for a book's kind.
export function itemNoun(kind: BookSummary['kind'], n: number): string {
  if (kind === 'secrets') return n === 1 ? 'secret' : 'secrets'
  return n === 1 ? 'recipe' : 'recipes'
}