import type { QaBook, QaData, QaQuestion } from '../../types/questions'

// Client-side aggregation for Question Analytics. Shares are out of the
// VeggieBooks in scope; questions allow several answers, so a question's
// shares can sum to more than 100%.

export type QaFilters = {
  age: string // '' for all
  vegetable: string // '' for all; excludes Secrets Books when set
  language: string // '' for all
}

export const noQaFilters: QaFilters = { age: '', vegetable: '', language: '' }

export const NOT_GIVEN = 'Not given'

export function applyFilters(books: QaBook[], f: QaFilters): QaBook[] {
  return books.filter(
    (b) =>
      (!f.age || (b.ageRange ?? NOT_GIVEN) === f.age) &&
      (!f.vegetable || b.vegetableCode === f.vegetable) &&
      (!f.language || b.language === f.language),
  )
}

export const veggieOf = (books: QaBook[]) => books.filter((b) => b.kind === 'veggie')

export function pct(part: number, all: number): number {
  return all === 0 ? 0 : Math.round((part / all) * 100)
}

export type ChoiceShare = { attribute: string; text: string; count: number; percent: number }

/** Answer shares for one question, highest first. */
export function shares(question: QaQuestion, veggie: QaBook[]): ChoiceShare[] {
  return question.choices
    .map((c) => {
      const count = veggie.filter((b) => b.answers.includes(c.attribute)).length
      return { attribute: c.attribute, text: c.text, count, percent: pct(count, veggie.length) }
    })
    .sort((a, b) => b.count - a.count)
}

/** Books that picked none of the question's choices. */
export function pickedNone(question: QaQuestion, veggie: QaBook[]): number {
  const set = new Set(question.choices.map((c) => c.attribute))
  return veggie.filter((b) => !b.answers.some((a) => set.has(a))).length
}

export type CompareBy = 'age' | 'vegetable' | 'language' | 'week'

export type Group = { key: string; label: string; books: QaBook[] }

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Column groups for "Compare by", empty groups omitted. Week shows the last 8 weeks with books. */
export function groupsOf(by: CompareBy, veggie: QaBook[], data: QaData): Group[] {
  const map = new Map<string, QaBook[]>()
  const keyOf = (b: QaBook): string =>
    by === 'age' ? (b.ageRange ?? NOT_GIVEN)
      : by === 'vegetable' ? (b.vegetableCode ?? '')
        : by === 'language' ? b.language
          : b.week
  for (const b of veggie) {
    const k = keyOf(b)
    map.set(k, [...(map.get(k) ?? []), b])
  }

  let keys = [...map.keys()]
  if (by === 'week') keys = keys.sort().slice(-8)
  else if (by === 'vegetable') {
    const order = data.vegetables.map((v) => v.code)
    keys.sort((a, b) => order.indexOf(a) - order.indexOf(b))
  } else keys.sort((a, b) => (a === NOT_GIVEN ? 1 : b === NOT_GIVEN ? -1 : a.localeCompare(b)))

  return keys.map((key) => ({ key, label: groupLabel(by, key, data), books: map.get(key) ?? [] }))
}

function groupLabel(by: CompareBy, key: string, data: QaData): string {
  if (by === 'vegetable') return data.vegetables.find((v) => v.code === key)?.name ?? key
  if (by === 'language') return key === 'es' ? 'Spanish' : 'English'
  if (by === 'week') {
    const [, m, d] = key.split('-').map(Number)
    return `${months[m - 1]} ${d}`
  }
  return key
}

/** Of books that picked the row answer, the share that also picked the column answer. */
export function crossShare(veggie: QaBook[], rowAttr: string, colAttr: string): { percent: number; base: number } {
  const base = veggie.filter((b) => b.answers.includes(rowAttr))
  return { percent: pct(base.filter((b) => b.answers.includes(colAttr)).length, base.length), base: base.length }
}

export type Descriptive = { label: string; n: number; mean: number; median: number; sd: number; min: number; max: number }

export function describe(label: string, values: number[]): Descriptive {
  const n = values.length
  if (n === 0) return { label, n: 0, mean: 0, median: 0, sd: 0, min: 0, max: 0 }
  const sorted = [...values].sort((a, b) => a - b)
  const mean = values.reduce((s, v) => s + v, 0) / n
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
  const sd = n > 1 ? Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1)) : 0
  return { label, n, mean, median, sd, min: sorted[0], max: sorted[n - 1] }
}

export function descriptives(books: QaBook[]): Descriptive[] {
  const veggie = veggieOf(books)
  const secrets = books.filter((b) => b.kind === 'secrets')
  const perPerson = new Map<number, number>()
  for (const b of books) perPerson.set(b.p, (perPerson.get(b.p) ?? 0) + 1)
  return [
    describe('Recipes per VeggieBook', veggie.map((b) => b.kept.length)),
    describe('Secrets per Secrets Book', secrets.map((b) => b.kept.length)),
    describe('Answers per VeggieBook', veggie.map((b) => b.answers.length)),
    describe('Books per participant', [...perPerson.values()]),
    describe('Extra copies per book', books.map((b) => b.extraCopies)),
  ]
}

export type TopItem = { id: number; code: string | null; title: string; image: string | null; kept: number; removed: number }

/** Most kept recipes or secrets, top 10. */
export function topKept(books: QaBook[], lookup: QaData['recipes'], noun: string): TopItem[] {
  const kept = new Map<number, number>()
  const removed = new Map<number, number>()
  for (const b of books) {
    for (const id of b.kept) kept.set(id, (kept.get(id) ?? 0) + 1)
    for (const id of b.removed) removed.set(id, (removed.get(id) ?? 0) + 1)
  }
  return [...kept.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, k]) => {
      const info = lookup[String(id)]
      return {
        id,
        code: info?.code ?? null,
        title: info?.title ?? `${noun} ${id}`,
        image: info?.image ?? null,
        kept: k,
        removed: removed.get(id) ?? 0,
      }
    })
}

/** Rows as CSV text with a header, quoted where needed. */
export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) => r.map((v) => (typeof v === 'string' && /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : String(v))).join(','))
    .join('\n')
}

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}