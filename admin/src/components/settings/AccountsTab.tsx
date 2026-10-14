import { useState } from 'react'
import { useAccountSearch } from '../../hooks/useAccountSearch'
import { useHeld } from '../../hooks/useHeld'
import type { AccountFilter, SiteSettingsInfo } from '../../types/settings'
import { formatDate } from '../../utils/format'
import { StatCard } from '../common/StatCard'
import { CardRowSkeleton } from '../skeletons/CardRowSkeleton'
import { TableSkeleton } from '../skeletons/TableSkeleton'
import { AccountPanel } from './AccountPanel'

// Settings, Accounts tab: account numbers, the searchable list, and the
// opened account. Regular admins never see admin accounts (the API leaves
// them out).

type Props = {
  info: SiteSettingsInfo | null
  isRoot: boolean
  currentEmail: string
  onChanged: () => void
}

const PAGE = 25

const filters: { id: AccountFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'reset', label: 'Reset locked' },
  { id: 'signin', label: 'Sign-in locked' },
]

export function AccountsTab({ info, isRoot, currentEmail, onChanged }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<AccountFilter>('all')
  const [take, setTake] = useState(PAGE)
  const [openId, setOpenId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { data, error, loading } = useAccountSearch(search, filter, take, refreshKey)
  // Outline stays up briefly even on a fast load.
  const firstLoad = useHeld(!data && !error)

  function changed() {
    setRefreshKey((k) => k + 1)
    onChanged()
  }

  function deleted() {
    setOpenId(null)
    changed()
  }

  function status(r: { recoveryLocked: boolean; signInLocked: boolean; isAdmin: boolean; isRootAdmin: boolean }) {
    if (r.recoveryLocked) return { text: 'Reset locked', tone: 'is-warn' }
    if (r.signInLocked) return { text: 'Sign-in locked', tone: 'is-warn' }
    if (r.isRootAdmin) return { text: 'Main admin', tone: 'is-root' }
    if (r.isAdmin) return { text: 'Admin', tone: 'is-admin' }
    return { text: 'Active', tone: 'is-ok' }
  }

  return (
    <div className="se-page">
      {info ? (
        <div className="bk-stats">
          <StatCard index={0} icon="users" label="Accounts" value={info.accounts.total} note="Guests not counted" />
          <StatCard index={1} icon="clock" label="Made this week" value={info.accounts.newThisWeek} note="Last 7 days" />
          <StatCard index={2} icon="lock" label="Reset locked" value={info.accounts.resetLocked} note="Need an admin to unlock" />
          <StatCard index={3} icon="activity" label="Sign-in locked" value={info.accounts.signInLocked} note="Clears on its own" />
        </div>
      ) : (
        <CardRowSkeleton className="bk-stats" />
      )}

      <div className="se-split">
        <section className="se-card se-table-card" aria-labelledby="se-accounts-title">
          <div className="se-card-head is-wrap">
            <h2 id="se-accounts-title">Accounts</h2>
            <div className="se-tools">
              <div className="se-seg" role="group" aria-label="Show">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={filter === f.id}
                    className={filter === f.id ? 'is-on' : undefined}
                    onClick={() => {
                      setFilter(f.id)
                      setTake(PAGE)
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <input
                type="search"
                className="se-search"
                aria-label="Search accounts"
                placeholder="Search email or username"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setTake(PAGE)
                }}
              />
            </div>
          </div>

          {error && (
            <p className="error se-pad" role="alert">
              {error}
            </p>
          )}

          {firstLoad || !data ? (
            !error && <TableSkeleton rows={7} cols={6} />
          ) : data.results.length === 0 ? (
            <p className="se-muted se-pad">No accounts found.</p>
          ) : (
            <>
              <div className="se-table" role="table" aria-label="Accounts">
                <div className="se-tr is-head" role="row">
                  <span role="columnheader" className="is-wide">
                    Email
                  </span>
                  <span role="columnheader">Username</span>
                  <span role="columnheader">Books</span>
                  <span role="columnheader">Made</span>
                  <span role="columnheader">Status</span>
                </div>
                {data.results.map((r) => {
                  const s = status(r)
                  return (
                    <button
                      key={r.id}
                      type="button"
                      role="row"
                      className={openId === r.id ? 'se-tr is-on' : 'se-tr'}
                      onClick={() => setOpenId(r.id)}
                    >
                      <span role="cell" className="is-wide se-strong">
                        {r.email}
                      </span>
                      <span role="cell">{r.username ?? 'None'}</span>
                      <span role="cell">{r.bookCount.toLocaleString()}</span>
                      <span role="cell" className="se-muted">
                        {formatDate(r.createdAt)}
                      </span>
                      <span role="cell">
                        <span className={`se-status ${s.tone}`}>{s.text}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="se-table-foot">
                <span>
                  Showing {data.results.length.toLocaleString()} of {data.total.toLocaleString()}
                  {loading && ', updating...'}
                </span>
                {data.results.length < data.total && (
                  <button type="button" className="se-btn" onClick={() => setTake((n) => n + PAGE)}>
                    Show more
                  </button>
                )}
              </div>
            </>
          )}
        </section>

        {openId && (
          <AccountPanel
            key={openId}
            id={openId}
            isRoot={isRoot}
            currentEmail={currentEmail}
            onClose={() => setOpenId(null)}
            onChanged={changed}
            onDeleted={deleted}
          />
        )}
      </div>

      {!isRoot && (
        <p className="se-note">Admin accounts are not listed here, and research IDs are never shown next to an email.</p>
      )}
    </div>
  )
}