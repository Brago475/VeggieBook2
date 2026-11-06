import { useCallback, useState } from 'react'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { Panel } from '../components/common/Panel'
import { TopbarActions } from '../components/layout/TopbarSlot'
import { NotificationCard } from '../components/notifications/NotificationCard'
import { NotificationEditor } from '../components/notifications/NotificationEditor'
import { StudyToast } from '../components/studies/StudyToast'
import { useHeld } from '../hooks/useHeld'
import { useNotifications } from '../hooks/useNotifications'
import type { AdminNotification, NotificationDraft } from '../types/notifications'
import '../styles/notifications.css'
import '../styles/studies-edit.css'

// Notifications page: messages shown inside the main site, in a pop-up and
// in the Notifications section of its menu. Live and scheduled first, then
// ended and stopped. API: api/Admin/AdminNotificationsController.cs.

type Editing = { mode: 'create' | 'edit'; from: AdminNotification | null }

export function Notifications() {
  const { list, templates, error, create, save, stop } = useNotifications()
  const [editing, setEditing] = useState<Editing | null>(null)
  const [stopping, setStopping] = useState<AdminNotification | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const closeEditor = useCallback(() => setEditing(null), [])
  const firstLoad = useHeld(!list && !error)

  if (!list && error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    )
  }

  if (firstLoad || !list || !templates) return <p className="muted">Loading notifications...</p>

  const current = list.filter((n) => n.status === 'live' || n.status === 'scheduled')
  const past = list.filter((n) => n.status === 'ended' || n.status === 'stopped')

  async function saveDraft(draft: NotificationDraft) {
    if (!editing) return null
    const isEdit = editing.mode === 'edit' && editing.from
    const message = isEdit ? await save(editing.from!.id, draft) : await create(draft)
    if (!message) {
      setEditing(null)
      setToast(isEdit ? `Saved notification #${editing.from!.id}.` : 'Notification saved.')
    }
    return message
  }

  async function confirmStop() {
    if (!stopping) return
    setBusy(true)
    const message = await stop(stopping.id)
    setBusy(false)
    setToast(message ?? `Stopped notification #${stopping.id}.`)
    setStopping(null)
  }

  const cards = (items: AdminNotification[]) => (
    <div className="nt-list">
      {items.map((item) => (
        <NotificationCard
          key={item.id}
          item={item}
          onEdit={(n) => setEditing({ mode: 'edit', from: n })}
          onCopy={(n) => setEditing({ mode: 'create', from: n })}
          onStop={setStopping}
        />
      ))}
    </div>
  )

  return (
    <div className="nt-page">
      <TopbarActions>
        <button type="button" className="button-primary" onClick={() => setEditing({ mode: 'create', from: null })}>
          New notification
        </button>
      </TopbarActions>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <Panel title="Live and scheduled">
        {current.length === 0 ? (
          <div className="nt-empty">
            <p className="muted">Nothing is showing or scheduled right now.</p>
            <button type="button" className="button-primary" onClick={() => setEditing({ mode: 'create', from: null })}>
              New notification
            </button>
          </div>
        ) : (
          cards(current)
        )}
      </Panel>

      {past.length > 0 && <Panel title="Ended and stopped">{cards(past)}</Panel>}

      {editing && (
        <NotificationEditor
          mode={editing.mode}
          from={editing.from}
          templates={templates}
          onSave={saveDraft}
          onClose={closeEditor}
        />
      )}

      {stopping && (
        <ConfirmDialog
          title={`Stop notification #${stopping.id}?`}
          message="It disappears from the app right away and can't be edited afterward. What people already did with it stays recorded."
          confirmLabel="Stop it"
          danger
          busy={busy}
          onConfirm={() => void confirmStop()}
          onCancel={() => setStopping(null)}
        />
      )}

      {toast && <StudyToast message={toast} onClose={closeToast} />}
    </div>
  )
}