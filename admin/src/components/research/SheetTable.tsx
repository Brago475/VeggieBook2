import { useState } from 'react'
import type { Sheet } from '../../types/research'

// A research sheet as a table: fixed header, the participant ID column
// fixed on the left while scrolling sideways, and pages of 50 rows.
//
// Question columns are headed Q1, Q2...; hover a header to see its full
// label. Long columns (answers and recipe lists) wrap instead of stretching
// the table. The Variables tab lists every column.
//
// The parent gives this a new key when the sheet changes, so paging starts
// over on page 1.

const PAGE_SIZE = 50

type Props = {
  sheet: Sheet
}

function isQuestion(key: string) {
  return /^q\d+$/.test(key)
}

function isLong(key: string) {
  return isQuestion(key) || key.endsWith('_list') || key === 'item_title'
}

function cellClass(key: string, type: string) {
  if (type === 'number') return 'num'
  return isLong(key) ? 'long' : undefined
}

export function SheetTable({ sheet }: Props) {
  const [page, setPage] = useState(0)

  if (sheet.rows.length === 0) {
    return <p className="muted">No rows match these filters.</p>
  }

  const pages = Math.ceil(sheet.rows.length / PAGE_SIZE)
  const start = page * PAGE_SIZE
  const rows = sheet.rows.slice(start, start + PAGE_SIZE)

  return (
    <>
      <div className="table-wrap sheet-scroll">
        <table className="data-table sheet-table">
          <thead>
            <tr>
              {sheet.columns.map((c) => (
                <th key={c.key} title={c.label} className={cellClass(c.key, c.type)}>
                  {isQuestion(c.key) ? c.key.toUpperCase() : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={start + i}>
                {sheet.columns.map((c) => {
                  const value = row[c.key]
                  return (
                    <td key={c.key} className={cellClass(c.key, c.type)}>
                      {value === null || value === undefined ? '' : value}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span className="muted small">
          Rows {start + 1} to {start + rows.length} of {sheet.rows.length}
        </span>
        <div className="pager-buttons">
          <button
            type="button"
            className="button-secondary"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
          >
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
    </>
  )
}