import { useState } from 'react'
import type { AllDataQuestion, ItemStatusFilter } from '../../types/allData'
import type { SheetRow } from '../../types/research'
import { bookKey, bookSubject, bookTitle, shortDate, shortTime } from '../../utils/allDataFormat'
import { shortAnswer } from '../../utils/answerNames'

// File 2 on screen: one row per recipe or secret, grouped under a bar for
// each book that opens and closes. With showAnswers on, the book's 0/1
// answers are repeated on every row, the same as the download.
//
// The parent gives this a new key when the rows change, so paging starts
// over on page 1.

const BOOKS_PER_PAGE = 20
const OPEN_AT_START = 3

type Props = {
  rows: SheetRow[]
  questions: AllDataQuestion[]
  status: ItemStatusFilter
  showAnswers: boolean
}

type BookGroup = {
  key: string
  first: SheetRow
  rows: SheetRow[]
  kept: number
  out: number
}

function matches(row: SheetRow, status: ItemStatusFilter) {
  if (status === 'kept') return row.status === 'Kept'
  if (status === 'out') return row.status !== 'Kept'
  return true
}

function groupByBook(rows: SheetRow[], status: ItemStatusFilter): BookGroup[] {
  const groups = new Map<string, BookGroup>()
  for (const row of rows) {
    const key = bookKey(row)
    let g = groups.get(key)
    if (!g) {
      g = { key, first: row, rows: [], kept: 0, out: 0 }
      groups.set(key, g)
    }
    if (row.status === 'Kept') g.kept += 1
    else g.out += 1
    if (matches(row, status)) g.rows.push(row)
  }
  return [...groups.values()].filter((g) => g.rows.length > 0)
}

export function ItemsTable({ rows, questions, status, showAnswers }: Props) {
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const groups = groupByBook(rows, status)
  if (groups.length === 0) return <p className="muted ad-empty">No recipes or secrets match these filters.</p>

  const pages = Math.ceil(groups.length / BOOKS_PER_PAGE)
  const start = page * BOOKS_PER_PAGE
  const shown = groups.slice(start, start + BOOKS_PER_PAGE)
  const isOpen = (g: BookGroup, i: number) => open[g.key] ?? i < OPEN_AT_START
  const answerColumns = showAnswers
    ? questions.flatMap((q) => q.choices.map((c) => ({ key: c.key, label: shortAnswer(c.text), q: q.no, title: `Q${q.no}. ${q.label} ${c.text}` })))
    : []

  function setAll(value: boolean) {
    setOpen(Object.fromEntries(shown.map((g) => [g.key, value])))
  }

  return (
    <div className="ad-table-card">
      <div className="ad-items-bar">
        <span className="muted small">Grouped by book. Click a book to open or close it.</span>
        <div className="ad-items-bar-buttons">
          <button type="button" className="ad-link" onClick={() => setAll(true)}>
            Open all
          </button>
          <button type="button" className="ad-link" onClick={() => setAll(false)}>
            Close all
          </button>
        </div>
      </div>

      <div className="ad-scroll">
        <table className="ad-table ad-items-table">
          <thead>
            <tr>
              <th className="is-sticky">Research ID</th>
              <th>Age</th>
              <th className="num">Book no.</th>
              <th>Vegetable or category</th>
              <th>Code</th>
              <th>Recipe or secret</th>
              <th>Type</th>
              <th>Status</th>
              <th className="num" title="Extra copies of this item in the book">
                Copies
              </th>
              {answerColumns.map((c) => (
                <th key={c.key} className="num is-answer" title={c.title}>
                  <span className="ad-th-small">Q{c.q}</span>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          {shown.map((g, i) => {
            const opened = isOpen(g, i)
            return (
              <tbody key={g.key}>
                <tr className="ad-book-row" onClick={() => setOpen({ ...open, [g.key]: !opened })}>
                  <td colSpan={9 + answerColumns.length}>
                    <div className="ad-book-bar">
                      <span className="ad-chevron" aria-hidden="true">
                        {opened ? '▾' : '▸'}
                      </span>
                      <span className="ad-id">{String(g.first.participant_id)}</span>
                      <strong>{bookTitle(g.first)}</strong>
                      <span className="muted small">
                        Book {String(g.first.book_no)}, {String(g.first.day ?? '').slice(0, 3)} {shortDate(g.first.date)},{' '}
                        {shortTime(g.first.time)}
                      </span>
                      <span className="ad-book-counts">
                        <span className="ad-pill is-kept">{g.kept} kept</span>
                        <span className={g.out > 0 ? 'ad-pill is-out' : 'ad-pill'}>{g.out} taken out</span>
                      </span>
                      <span className="sr-only">{opened ? 'Close this book' : 'Open this book'}</span>
                    </div>
                  </td>
                </tr>
                {opened &&
                  g.rows.map((r, j) => {
                    const out = r.status !== 'Kept'
                    const copies = Number(r.extra_copies ?? 0)
                    return (
                      <tr key={j} className="ad-item-row">
                        <td className="is-sticky">
                          <span className="ad-id is-quiet">{String(r.participant_id)}</span>
                        </td>
                        <td>{String(r.age_range ?? '')}</td>
                        <td className="num">{String(r.book_no)}</td>
                        <td>{bookSubject(r)}</td>
                        <td>
                          <span className="ad-code">{String(r.item_code ?? '')}</span>
                        </td>
                        <td className={out ? 'ad-item-title is-out' : 'ad-item-title'}>{String(r.item_title ?? '')}</td>
                        <td>{String(r.item_type ?? '')}</td>
                        <td>
                          <span className={out ? 'ad-pill is-out' : 'ad-pill is-kept'}>{out ? 'Taken out' : 'Kept'}</span>
                        </td>
                        <td className="num">
                          <span className={copies > 0 ? 'strong' : 'ad-faint'}>{copies}</span>
                        </td>
                        {answerColumns.map((c) => {
                          const v = r[c.key]
                          return (
                            <td key={c.key} className="num">
                              {v === null || v === undefined ? null : (
                                <span className={v === 1 ? 'ad-bin is-on' : 'ad-bin'}>{String(v)}</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
              </tbody>
            )
          })}
        </table>
      </div>

      <div className="ad-pager">
        <span className="muted small">
          Books {start + 1} to {start + shown.length} of {groups.length}
        </span>
        <div className="ad-pager-buttons">
          <button type="button" className="button-secondary" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
            Previous
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= pages - 1}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}