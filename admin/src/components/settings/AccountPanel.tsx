import { useEffect, useState } from 'react'
import type { AccountDetail } from '../../types/settings'
import { api } from '../../utils/api'
import { formatDate, formatDateTime } from '../../utils/format'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { NavIcon } from '../icons/NavIcons'

// One account, opened from the Accounts table. Never shows a research ID,
// so an email is never matched to research data here. Admin access is
// changed by the root admin only (enforced by the API as well).

type Props = {
  id: string
  isRoot: boolean
  currentEmail: string
  onClose: () => void
  onChanged: () => void
}

type Pending = {
  title: string
  message: string
  confirmLabel: string
  danger: boolean
  run: () => Promise<unknown>
}

export function AccountPanel({ id, isRoot, currentEmail, onClose, onChanged }: Props) {
  const [account, setAccount] = useState<AccountDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [pending, setPending] = useState<Pending | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    api<AccountDetail>(`/admin/accounts/${id}`)
      .then((a) => {
        if (cancelled) return
        setAccount(a)
        setError(null)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [id, version])

  async function confirm() {
    if (!pending) return
    setBusy(true)
    try {
      await pending.run()
      setVersion((v) => v + 1)
      onChanged()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  const current = account?.id === id ? account : null
  const isAdmin = current?.roles.includes('Admin') ?? false
  const isSelf = (current?.email ?? '').toLowerCase() === currentEmail.toLowerCase()
  const base = `/admin/accounts/${id}`

  return (
    <aside className="se-card se-panel" aria-labelledby="se-panel-title">
      <div className="se-card-head">
        <h2 id="se-panel-title">Account</h2>
        <button type="button" className="se-icon-btn" aria-label="Close" onClick={onClose}>
          <NavIcon name="close" size={16} />
        </button>
      </div>

      {error && (
        <p className="error se-pad" role="alert">
          {error}
        </p>
      )}

      {!current && !error && <p className="se-muted se-pad">Loading...</p>}

      {current && (
        <>
          <div className="se-panel-who">
            <span className="se-avatar">{current.email.charAt(0).toUpperCase()}</span>
            <span className="se-panel-who-text">
              <strong>{current.email}</strong>
              <span>Email is a label only, never tracked</span>
            </span>
          </div>

          <dl className="se-facts">
            <div>
              <dt>Username</dt>
              <dd>{current.username ?? 'None'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{isAdmin ? (current.isRootAdmin ? 'Main admin' : 'Admin') : 'User'}</dd>
            </div>
            <div>
              <dt>Age range</dt>
              <dd>{current.ageRange ?? 'Not given'}</dd>
            </div>
            <div>
              <dt>Made</dt>
              <dd>{formatDate(current.createdAt)}</dd>
            </div>
            <div>
              <dt>Terms</dt>
              <dd>{current.termsVersion ? `Version ${current.termsVersion}` : 'Not recorded'}</dd>
            </div>
            <div>
              <dt>Books</dt>
              <dd>{current.bookCount.toLocaleString()}</dd>
            </div>
          </dl>

          <div className="se-panel-block">
            <div className="se-panel-line">
              <strong>Password reset</strong>
              {current.recoveryLockedAt ? (
                <span className="se-status is-warn">Locked</span>
              ) : (
                <span className="se-status is-ok">Open</span>
              )}
            </div>
            {current.recoveryLockedAt ? (
              <>
                <p className="se-muted">
                  Locked since {formatDateTime(current.recoveryLockedAt)} after 3 wrong answers. Unlocking lets the owner
                  try their PIN and question again.
                </p>
                <button
                  type="button"
                  className="se-btn is-dark"
                  onClick={() =>
                    setPending({
                      title: 'Unlock password reset?',
                      message: `${current.email} will be able to reset their password with their PIN and security question again.`,
                      confirmLabel: 'Unlock',
                      danger: false,
                      run: () => api(`${base}/unlock-recovery`, { method: 'POST' }),
                    })
                  }
                >
                  Unlock password reset
                </button>
              </>
            ) : (
              <p className="se-muted">Nothing to unlock.</p>
            )}
            {current.signInLockedUntil && (
              <p className="se-muted">
                Sign-in is locked after too many wrong passwords until {formatDateTime(current.signInLockedUntil)}. It
                clears on its own.
              </p>
            )}
          </div>

          {isRoot && (
            <div className="se-panel-block">
              <div className="se-panel-line">
                <strong>Admin access</strong>
                <span className="se-root">
                  <NavIcon name="lock" size={13} />
                  Main admin only
                </span>
              </div>
              {current.isRootAdmin ? (
                <p className="se-muted">The main admin can only be changed on the server.</p>
              ) : isSelf ? (
                <p className="se-muted">This is your account.</p>
              ) : isAdmin ? (
                <button
                  type="button"
                  className="se-btn is-danger"
                  onClick={() =>
                    setPending({
                      title: 'Remove admin access?',
                      message: `${current.email} will lose access to the admin site right away. Their normal account stays the same.`,
                      confirmLabel: 'Remove admin',
                      danger: true,
                      run: () => api(`${base}/admin`, { method: 'DELETE' }),
                    })
                  }
                >
                  Remove admin
                </button>
              ) : (
                <button
                  type="button"
                  className="se-btn"
                  onClick={() =>
                    setPending({
                      title: 'Make this account an admin?',
                      message: `${current.email} will be able to open the admin site, see accounts and research data, and manage studies.`,
                      confirmLabel: 'Make admin',
                      danger: false,
                      run: () => api(`${base}/admin`, { method: 'POST' }),
                    })
                  }
                >
                  Make admin
                </button>
              )}
            </div>
          )}
        </>
      )}

      {pending && (
        <ConfirmDialog
          title={pending.title}
          message={pending.message}
          confirmLabel={pending.confirmLabel}
          danger={pending.danger}
          busy={busy}
          onConfirm={() => void confirm()}
          onCancel={() => setPending(null)}
        />
      )}
    </aside>
  )
}