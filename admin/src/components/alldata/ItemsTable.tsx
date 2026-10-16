import { useState, type ReactNode } from 'react'
import type { AllDataQuestion, ItemStatusFilter } from '../../types/allData'
import type { SheetRow } from '../../types/research'
import { bookKey, bookSubject, bookTitle, shortDate, shortTime } from '../../utils/allDataFormat'
import { shortAnswer } from '../../utils/answerNames'
import { AllDataIcon } from './AllDataIcons'
import { ItemPreviewCard, ItemThumb, useItemPreview } from './ItemPreview'

// File 2 on screen: one row per recipe or secret, in a card, grouped under
// a bar for each book that opens and closes. `head` (the Status switch and
// the answers toggle) sits at the top of the card.
//
// Each item shows a small picture; hover it to see the full picture and
// its details. With showAnswers on, the book's 0/1 answers are repeated on
// every row, the same as the download.
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
  head: ReactNode
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

export function ItemsTable({ rows, questions, status, showAnswers, head }: Props) {
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const { preview, handlers } = useItemPreview()

  const groups = groupByBook(rows, status)
  const pages = Math.max(1, Math.ceil(groups.length / BOOKS_PER_PAGE))
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
    <div className="vbd-table-card">
      <div className="vbd-card-head-row">
        <div className="vbd-card-head-left">{head}</div>
        <div className="vbd-items-bar-buttons">
          <button type="button" className="vbd-link" onClick={() => setAll(true)}>
            Open all
          </button>
          <button type="button" className="vbd-link" onClick={() => setAll(false)}>
            Close all
          </button>
          <span className="vbd-count">
            {groups.length === 0 ? 'No books' : `Books ${start + 1} to ${start + shown.length} of ${groups.length}`}
          </span>
        </div>
      </div>

      {groups.length === 0 && <p className="muted vbd-empty">No recipes or secrets match these filters.</p>}

      {groups.length > 0 && (
        <div className="vbd-scroll">
          <table className="vbd-table vbd-items-table">
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
                    <span className="vbd-th-small">Q{c.q}</span>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            {shown.map((g, i) => {
              const opened = isOpen(g, i)
              return (
                <tbody key={g.key}>
                  <tr className="vbd-book-row" onClick={() => setOpen({ ...open, [g.key]: !opened })}>
                    <td colSpan={9 + answerColumns.length}>
                      <div className="vbd-book-bar">
                        <span className="vbd-chevron" aria-hidden="true">
                          {opened ? '▾' : '▸'}
                        </span>
                        <span className="vbd-id">{String(g.first.participant_id)}</span>
                        <strong>{bookTitle(g.first)}</strong>
                        <span className="vbd-book-when">
                          Book {String(g.first.book_no)}
                          <span className="vbd-dot" aria-hidden="true" />
                          <span className="vbd-date">
                            {String(g.first.day ?? '').slice(0, 3)} {shortDate(g.first.date)}
                          </span>
                          <span className="vbd-time">{shortTime(g.first.time)}</span>
                        </span>
                        <span className="vbd-book-counts">
                          <span className="vbd-pill is-kept">{g.kept} kept</span>
                          <span className={g.out > 0 ? 'vbd-pill is-out' : 'vbd-pill'}>{g.out} taken out</span>
                        </span>
                        <span className="sr-only">{opened ? 'Close this book' : 'Open this book'}</span>
                      </div>
                    </td>
                  </tr>
                  {opened &&
                    g.rows.map((r, j) => {
                      const out = r.status !== 'Kept'
                      const secret = r.item_type === 'Secret'
                      const copies = Number(r.extra_copies ?? 0)
                      return (
                        <tr key={j} className="vbd-item-row">
                          <td className="is-sticky">
                            <span className="vbd-id is-quiet">{String(r.participant_id)}</span>
                          </td>
                          <td>{r.age_range ? String(r.age_range) : <span className="vbd-faint">Not given</span>}</td>
                          <td className="num">{String(r.book_no)}</td>
                          <td>
                            <span className={secret ? 'vbd-badge is-violet' : 'vbd-badge is-green'}>{bookSubject(r)}</span>
                          </td>
                          <td>
                            <span className="vbd-code">{String(r.item_code ?? '')}</span>
                          </td>
                          <td className={out ? 'vbd-item-title is-out' : 'vbd-item-title'}>
                            <span className="vbd-title-cell" tabIndex={0} {...handlers(r)}>
                              <ItemThumb row={r} />
                              {String(r.item_title ?? '')}
                            </span>
                          </td>
                          <td>
                            <span className={secret ? 'vbd-type is-violet' : 'vbd-type is-green'}>{String(r.item_type ?? '')}</span>
                          </td>
                          <td>
                            <span className={out ? 'vbd-pill is-out' : 'vbd-pill is-kept'}>{out ? 'Taken out' : 'Kept'}</span>
                          </td>
                          <td className="num">
                            <span className={copies > 0 ? 'strong' : 'vbd-faint'}>{copies}</span>
                          </td>
                          {answerColumns.map((c) => {
                            const v = r[c.key]
                            return (
                              <td key={c.key} className="num">
                                {v === null || v === undefined ? null : (
                                  <span className={v === 1 ? 'vbd-bin is-on' : 'vbd-bin'}>{String(v)}</span>
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
      )}

      <ItemPreviewCard preview={preview} />

      <div className="vbd-pager">
        <span className="muted small">Click a book to open or close it. Hover a recipe to see it.</span>
        <div className="vbd-pager-buttons">
          <button type="button" className="vbd-page-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
            <AllDataIcon name="left" size={16} />
            Previous
          </button>
          <button
            type="button"
            className="vbd-page-btn"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= pages - 1}
          >
            Next
            <AllDataIcon name="right" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}