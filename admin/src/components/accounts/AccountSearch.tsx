import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import type { AccountRow, AccountSearchResult } from '../../types/admin'
import { api } from '../../utils/api'
import { formatDate } from '../../utils/format'

// Search accounts by email or username. With an empty search, the newest
// accounts are listed. The API returns at most `limit` results, so a long
// list asks the admin to narrow the search.

type Props = {
  onOpen: (id: string) => void
  refreshKey: number
}

export function AccountSearch({ onOpen, refreshKey }: Props) {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<AccountRow[] | null>(null)
  const [limit, setLimit] = useState(25)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The last search that ran, so a refresh repeats it.
  const lastQuery = useRef('')

  const run = useCallback(async (q: string) => {
    lastQuery.current = q
    setBusy(true)
    setError(null)
    try {
      const data = await api<AccountSearchResult>(`/admin/accounts?q=${encodeURIComponent(q)}`)
      setRows(data.results)
      setLimit(data.limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    void run(lastQuery.current)
  }, [run, refreshKey])

  function submit(e: FormEvent) {
    e.preventDefault()
    void run(query.trim())
  }

  return (
    <>
      <h1 className="page-title">Accounts</h1>

      <form className="search" onSubmit={submit} role="search">
        <input
          type="search"
          className="search-input"
          placeholder="Search by email or username"
          aria-label="Search by email or username"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="button-primary" disabled={busy}>
          Search
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {rows && rows.length === 0 && <p className="muted">No accounts found.</p>}

      {rows && rows.length > 0 && (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Username</th>
                <th>Books</th>
                <th>Created</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="table-row" onClick={() => onOpen(r.id)}>
                  <td>
                    <button
                      type="button"
                      className="link-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpen(r.id)
                      }}
                    >
                      {r.email}
                    </button>
                  </td>
                  <td>{r.username}</td>
                  <td>{r.bookCount}</td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td>
                    {/* An inner div, because display: flex on the cell
                        itself breaks the table's row borders. */}
                    <div className="badges">
                      {r.isRootAdmin ? (
                        <span className="badge">Root admin</span>
                      ) : (
                        r.isAdmin && <span className="badge">Admin</span>
                      )}
                      {r.recoveryLocked && <span className="badge is-warn">Reset locked</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows && rows.length === limit && (
        <p className="muted small">
          Showing the first {limit}. Search to narrow the list.
        </p>
      )}
    </>
  )
}