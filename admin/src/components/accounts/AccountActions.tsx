import { useState } from 'react'
import type { AccountInfo } from '../../types/admin'
import { api } from '../../utils/api'
import { formatDateTime } from '../../utils/format'
import { ConfirmDialog } from '../common/ConfirmDialog'

// What an admin can do to an account: unlock password reset, and give or
// remove the Admin role.
//
// The API enforces every rule (not your own role, not the root admin). The
// buttons are hidden here only so the screen doesn't offer something the
// API will refuse.

type Props = {
  account: AccountInfo
  currentEmail: string
  onChanged: () => void
}

type Pending = {
  title: string
  message: string
  confirmLabel: string
  danger: boolean
  run: () => Promise<unknown>
}

export function AccountActions({ account, currentEmail, onChanged }: Props) {
  const [pending, setPending] = useState<Pending | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = account.roles.includes('Admin')
  const isSelf = (account.email ?? '').toLowerCase() === currentEmail.toLowerCase()
  const base = `/admin/accounts/${account.id}`

  async function confirm() {
    if (!pending) return
    setBusy(true)
    setError(null)
    try {
      await pending.run()
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  return (
    <section className="card actions">
      <h2 className="section-title">Actions</h2>

      <div className="action">
        <h3 className="action-title">Password reset</h3>
        {account.recoveryLockedAt ? (
          <>
            <p className="muted">
              Locked since {formatDateTime(account.recoveryLockedAt)} after 3 wrong security
              answers. Unlocking lets the owner try the PIN and question again.
            </p>
            <button
              type="button"
              className="button-primary"
              onClick={() =>
                setPending({
                  title: 'Unlock password reset?',
                  message: `${account.email} will be able to reset their password with their PIN and security question again.`,
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
          <p className="muted">Open. Nothing to unlock.</p>
        )}
      </div>

      <div className="action">
        <h3 className="action-title">Admin access</h3>
        {account.isRootAdmin ? (
          <p className="muted">Root admin. Can only be changed on the server.</p>
        ) : isSelf ? (
          <p className="muted">This is your account. Another admin has to change your role.</p>
        ) : isAdmin ? (
          <button
            type="button"
            className="button-danger"
            onClick={() =>
              setPending({
                title: 'Remove admin access?',
                message: `${account.email} will lose access to the admin site right away. Their normal account stays the same.`,
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
            className="button-secondary"
            onClick={() =>
              setPending({
                title: 'Make this account an admin?',
                message: `${account.email} will be able to sign in to the admin site, see accounts and books, unlock accounts, and add or remove other admins.`,
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

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
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
    </section>
  )
}