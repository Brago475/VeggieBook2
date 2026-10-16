import { useEffect, useState } from 'react'
import type { IdentityHistoryEntry, IdentityHistoryResponse } from '../../types/settings'
import { api } from '../../utils/api'
import { formatDateTime } from '../../utils/format'
import { NavIcon } from '../icons/NavIcons'
import '../../styles/identity-history.css'

// Main admin only: every time Identity records were opened or a research ID
// was revealed, newest first. Viewing this list is not itself recorded.
// refreshKey changes after each open or reveal, so an open list stays current.

type Props = { refreshKey: number }

function describe(entry: IdentityHistoryEntry): string {
  if (entry.action === 'identity_opened') return 'Opened identity records'
  if (entry.targetEmail) return `Revealed the research ID for ${entry.targetEmail}`
  return 'Revealed the research ID for an account that was later deleted'
}

export function IdentityHistory({ refreshKey }: Props) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<IdentityHistoryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    api<IdentityHistoryResponse>('/admin/settings/identity/history')
      .then((r) => {
        if (cancelled) return
        setData(r)
        setError(null)
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message)
      })
    return () => {
      cancelled = true
    }
  }, [open, refreshKey])

  function hide() {
    setOpen(false)
    setData(null)
    setError(null)
  }

  if (!open) {
    return (
      <div className="se-identity">
        <div className="se-locked">
          <span>
            <NavIcon name="lock" size={16} />
            History is hidden
          </span>
          <button type="button" className="se-btn" onClick={() => setOpen(true)}>
            Show history
          </button>
        </div>
      </div>
    )
  }

  const entries = data?.entries ?? []

  return (
    <div className="se-identity">
      <div className="se-identity-tools">
        <span className="se-muted ih-count">
          {data === null
            ? 'Loading history...'
            : entries.length === data.limit
              ? `Latest ${data.limit} entries`
              : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
        </span>
        <button type="button" className="se-btn" onClick={hide}>
          Hide history
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {data !== null && entries.length === 0 && (
        <p className="se-muted ih-empty">Nothing recorded yet.</p>
      )}

      {entries.length > 0 && (
        <ul className="ih-list" aria-label="Identity record history">
          {entries.map((entry, i) => (
            <li
              key={`${entry.at}-${i}`}
              className={entry.action === 'research_id_revealed' ? 'ih-item is-reveal' : 'ih-item'}
            >
              <span className="ih-dot" aria-hidden="true" />
              <span className="ih-text">
                <span className="ih-title">{describe(entry)}</span>
                <span className="ih-meta">
                  {entry.adminEmail}, {formatDateTime(entry.at)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}