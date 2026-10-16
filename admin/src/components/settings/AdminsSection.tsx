import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { AccountRow, AdminRow } from '../../types/settings'
import { api } from '../../utils/api'
import { formatDate } from '../../utils/format'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { AccountPicker } from './AccountPicker'
import { SettingsCard, SettingsRow } from './SettingsCard'

// Main admin only: every admin, removing one, and adding one from the list
// of existing accounts.

export function AdminsSection() {
  const [admins, setAdmins] = useState<AdminRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [picked, setPicked] = useState<AccountRow | null>(null)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<AdminRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(async () => {
    try {
      setAdmins(await api<AdminRow[]>('/admin/settings/admins'))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function add(e: FormEvent) {
    e.preventDefault()
    if (!picked || adding) return
    setAdding(true)
    setAddError(null)
    try {
      await api(`/admin/accounts/${picked.id}/admin`, { method: 'POST' })
      setPicked(null)
      setRefreshKey((k) => k + 1)
      await load()
    } catch (err) {
      setAddError((err as Error).message)
    } finally {
      setAdding(false)
    }
  }

  async function remove() {
    if (!removing) return
    setBusy(true)
    try {
      await api(`/admin/accounts/${removing.id}/admin`, { method: 'DELETE' })
      setRefreshKey((k) => k + 1)
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
      setRemoving(null)
    }
  }

  return (
    <SettingsCard id="admins" title="Admins" rootOnly>
      <SettingsRow label="Who can open this site" help="Other admins never see this list. The main admin is set on the server.">
        <div className="se-admins">
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {!admins && !error && <p className="se-muted">Loading...</p>}
          {admins?.map((a) => (
            <div key={a.id} className="se-admin">
              <span className="se-avatar is-small">{a.email.charAt(0).toUpperCase()}</span>
              <span className="se-admin-text">
                <strong>
                  {a.email}
                  {a.isYou && <span className="se-you">You</span>}
                </strong>
                <span>{a.isRoot ? 'Main admin, set on the server' : `Account made ${formatDate(a.createdAt)}`}</span>
              </span>
              <span className={a.isRoot ? 'se-label is-root' : 'se-label'}>ADMIN</span>
              {!a.isRoot && !a.isYou && (
                <button type="button" className="se-btn is-danger is-small" onClick={() => setRemoving(a)}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </SettingsRow>

      <SettingsRow
        label={<label htmlFor="se-add-admin">Add an admin</label>}
        help="Pick an existing account. Accounts that are already admins are not listed."
      >
        <form className="se-inline-form" onSubmit={add}>
          <AccountPicker picked={picked} onPick={setPicked} refreshKey={refreshKey} />
          <button type="submit" className="se-btn is-dark" disabled={adding || !picked}>
            {adding ? 'Adding...' : 'Make admin'}
          </button>
          {addError && (
            <p className="error se-full" role="alert">
              {addError}
            </p>
          )}
        </form>
      </SettingsRow>

      {removing && (
        <ConfirmDialog
          title="Remove admin access?"
          message={`${removing.email} will lose access to the admin site right away. Their normal account stays the same.`}
          confirmLabel="Remove admin"
          danger
          busy={busy}
          onConfirm={() => void remove()}
          onCancel={() => setRemoving(null)}
        />
      )}
    </SettingsCard>
  )
}