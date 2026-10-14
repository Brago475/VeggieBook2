import { useMemo, useState } from 'react'
import type { IdentityRow } from '../../types/settings'
import { api } from '../../utils/api'
import { formatDate } from '../../utils/format'
import { NavIcon } from '../icons/NavIcons'
import { IdentityHistory } from './IdentityHistory'
import { SettingsCard, SettingsRow } from './SettingsCard'

// Main admin only: email, username and date made, hidden until opened. A
// research ID is fetched only when revealed, one person at a time. Opening
// the records and each reveal are recorded in the history below.

type Revealed = { id: string | null; note: string | null }

export function IdentitySection() {
  const [rows, setRows] = useState<IdentityRow[] | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [revealed, setRevealed] = useState<Record<string, Revealed>>({})
  const [revealing, setRevealing] = useState<string | null>(null)
  const [recorded, setRecorded] = useState(0)

  async function show() {
    setLoading(true)
    setError(null)
    try {
      setRows(await api<IdentityRow[]>('/admin/settings/identity'))
      setOpen(true)
      setRecorded((n) => n + 1)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function hide() {
    setOpen(false)
    setRows(null)
    setRevealed({})
    setSearch('')
  }

  async function reveal(id: string) {
    setRevealing(id)
    setError(null)
    try {
      const r = await api<{ researchId: string | null; note: string | null }>(`/admin/settings/identity/${id}/research-id`)
      setRevealed((prev) => ({ ...prev, [id]: { id: r.researchId, note: r.note } }))
      if (r.researchId) setRecorded((n) => n + 1)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setRevealing(null)
    }
  }

  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (rows ?? []).filter(
      (r) => !needle || r.email.toLowerCase().includes(needle) || (r.username ?? '').toLowerCase().includes(needle),
    )
  }, [rows, search])

  return (
    <SettingsCard id="identity" title="Identity records" rootOnly>
      <SettingsRow
        label="Email, username, date made"
        help="Hidden until opened. A research ID shows only when you reveal it, one person at a time. Opening and revealing are both recorded."
      >
        <div className="se-identity">
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          {!open ? (
            <div className="se-locked">
              <span>
                <NavIcon name="lock" size={16} />
                Records are hidden
              </span>
              <button type="button" className="se-btn is-dark" onClick={() => void show()} disabled={loading}>
                {loading ? 'Opening...' : 'Show records'}
              </button>
            </div>
          ) : (
            <>
              <div className="se-identity-tools">
                <input
                  type="search"
                  className="se-search"
                  aria-label="Search identity records"
                  placeholder="Search email or username"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button type="button" className="se-btn" onClick={hide}>
                  Hide records
                </button>
              </div>

              <div className="se-table is-compact" role="table" aria-label="Identity records">
                <div className="se-tr is-head is-four" role="row">
                  <span role="columnheader">Email</span>
                  <span role="columnheader">Username</span>
                  <span role="columnheader">Made</span>
                  <span role="columnheader">Research ID</span>
                </div>
                {shown.map((r) => {
                  const rev = revealed[r.id]
                  return (
                    <div key={r.id} role="row" className={rev ? 'se-tr is-four is-revealed' : 'se-tr is-four'}>
                      <span role="cell" className="se-strong">
                        {r.email}
                        {r.isAdmin && <span className="se-you">Admin</span>}
                      </span>
                      <span role="cell">{r.username ?? 'None'}</span>
                      <span role="cell" className="se-muted">
                        {formatDate(r.createdAt)}
                      </span>
                      <span role="cell">
                        {rev ? (
                          rev.id ? (
                            <span className="se-mono">{rev.id}</span>
                          ) : (
                            <span className="se-muted">{rev.note ?? 'None'}</span>
                          )
                        ) : (
                          <button
                            type="button"
                            className="se-btn is-small"
                            disabled={revealing === r.id}
                            onClick={() => void reveal(r.id)}
                          >
                            {revealing === r.id ? '...' : 'Reveal'}
                          </button>
                        )}
                      </span>
                    </div>
                  )
                })}
                {shown.length === 0 && <p className="se-muted se-pad">No accounts match.</p>}
              </div>
            </>
          )}
        </div>
      </SettingsRow>

      <SettingsRow
        label="Identity record history"
        help="Every time these records were opened or a research ID was revealed: who, when, and which account. Kept permanently and never part of research downloads."
      >
        <IdentityHistory refreshKey={recorded} />
      </SettingsRow>
    </SettingsCard>
  )
}