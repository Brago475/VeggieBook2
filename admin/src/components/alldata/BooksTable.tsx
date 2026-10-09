import { useState } from 'react'
import type { SheetRow } from '../../types/research'
import type { DisplayColumn } from '../../utils/allDataColumns'
import { groupLabels } from '../../utils/allDataColumns'
import { bookKey, bookSubject, isSecrets, shortDate, shortDay, shortTime } from '../../utils/allDataFormat'
import { shortAnswer } from '../../utils/answerNames'

// File 1 on screen: one row per book. A top header row names each group
// (Person, Book, Answers, Recipes and secrets); the research ID stays
// fixed on the left while scrolling sideways. Click a row to open it in
// the side panel.
//
// The parent gives this a new key when the rows change, so paging starts
// over on page 1.

const PAGE_SIZE = 25
const MAX_CHIPS = 2

type Props = {
  rows: SheetRow[]
  columns: DisplayColumn[]
  selected: string | null
  onSelect: (key: string) => void
}

// The top header row. The research ID gets its own cell, fixed on the left
// with the column under it; every other group is one wide cell whose label
// slides along while scrolling sideways, so it is always readable.
function groupSpans(columns: DisplayColumn[]) {
  const spans: { group: DisplayColumn['group']; span: number; sticky: boolean; label: boolean }[] = []
  columns.forEach((c, i) => {
    const last = spans[spans.length - 1]
    if (i > 0 && last && last.group === c.group && !last.sticky) {
      last.span += 1
      return
    }
    const sameGroupBefore = last !== undefined && last.group === c.group
    spans.push({ group: c.group, span: 1, sticky: c.kind === 'id', label: !sameGroupBefore })
  })
  return spans
}

function Cell({ row, column }: { row: SheetRow; column: DisplayColumn }) {
  const value = row[column.key]

  switch (column.kind) {
    case 'id':
      return <span className="ad-id">{String(value ?? '')}</span>
    case 'date':
      return <>{shortDate(value)}</>
    case 'time':
      return <>{shortTime(value)}</>
    case 'day':
      return <>{shortDay(value)}</>
    case 'subject':
      return <>{bookSubject(row)}</>
    case 'chips': {
      if (isSecrets(row)) return <span className="ad-faint">n/a</span>
      const picked = (column.question?.choices ?? [])
        .filter((c) => row[c.key] === 1)
        .map((c) => shortAnswer(c.text))
      if (picked.length === 0) return <span className="ad-faint">None</span>
      return (
        <span className="ad-chips">
          {picked.slice(0, MAX_CHIPS).map((p) => (
            <span key={p} className="ad-chip">
              {p}
            </span>
          ))}
          {picked.length > MAX_CHIPS && <span className="ad-more-count">+{picked.length - MAX_CHIPS}</span>}
        </span>
      )
    }
    case 'bin':
      if (value === null || value === undefined) return null
      return <span className={value === 1 ? 'ad-bin is-on' : 'ad-bin'}>{String(value)}</span>
    case 'num': {
      if (value === null || value === undefined) return <span className="ad-faint">-</span>
      const out = (column.key === 'recipes_removed' || column.key === 'secrets_removed') && Number(value) > 0
      const zero = Number(value) === 0
      return <span className={out ? 'ad-out' : zero ? 'ad-faint' : undefined}>{String(value)}</span>
    }
    default:
      return <>{value === null || value === undefined ? '' : String(value)}</>
  }
}

function alignClass(column: DisplayColumn) {
  return column.kind === 'num' || column.kind === 'bin' ? 'num' : undefined
}

export function BooksTable({ rows, columns, selected, onSelect }: Props) {
  const [page, setPage] = useState(0)

  if (rows.length === 0) return <p className="muted ad-empty">No books match these filters.</p>

  const pages = Math.ceil(rows.length / PAGE_SIZE)
  const start = page * PAGE_SIZE
  const shown = rows.slice(start, start + PAGE_SIZE)

  return (
    <div className="ad-table-card">
      <div className="ad-scroll">
        <table className="ad-table">
          <thead>
            <tr className="ad-group-row">
              {groupSpans(columns).map((g, i) => (
                <th
                  key={`${g.group}-${i}`}
                  colSpan={g.span}
                  className={`ad-group is-${g.group}${g.sticky ? ' is-sticky' : ''}`}
                >
                  {g.label && <span className="ad-group-label">{groupLabels[g.group]}</span>}
                </th>
              ))}
            </tr>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  title={c.title}
                  className={[alignClass(c), c.kind === 'id' ? 'is-sticky' : '', c.group === 'answers' ? 'is-answer' : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  {c.small && <span className="ad-th-small">{c.small}</span>}
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => {
              const key = bookKey(row)
              const isSelected = key === selected
              return (
                <tr
                  key={key}
                  className={isSelected ? 'is-selected' : undefined}
                  onClick={() => onSelect(key)}
                  aria-selected={isSelected}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={[alignClass(c), c.kind === 'id' ? 'is-sticky' : ''].filter(Boolean).join(' ')}>
                      <Cell row={row} column={c} />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="ad-pager">
        <span className="muted small">
          Books {start + 1} to {start + shown.length} of {rows.length}. Click a row for details.
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