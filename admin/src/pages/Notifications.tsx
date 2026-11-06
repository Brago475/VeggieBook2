import { useCallback, useState } from 'react'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { NumberCard } from '../components/common/NumberCard'
import { Panel } from '../components/common/Panel'
import { Tabs } from '../components/common/Tabs'
import { TopbarActions } from '../components/layout/TopbarSlot'
import { NotificationEditor } from '../components/notifications/NotificationEditor'
import { NotificationTable } from '../components/notifications/NotificationTable'
import { StudyToast } from '../components/studies/StudyToast'
import { useHeld } from '../hooks/useHeld'
import { useNotifications } from '../hooks/useNotifications'
import type { AdminNotification, NotificationDraft } from '../types/notifications'
import '../styles/notifications.css'
import '../styles/studies-edit.css'

// Notifications page: messages shown inside the main site, in a pop-up and
// in the Notifications section of its menu. Number cards on top, then one
// table with Live and scheduled / Ended and stopped tabs.
// API: api/Admin/AdminNotificationsController.cs.

type Editing = { mode: 'create' | 'edit'; from: AdminNotification | null }
type View = 'current' | 'past'

export function Notifications() {
  const { list, templates, error, create, save, stop } = useNotifications()
  const [view, setView] = useState<View>('current')
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
  const shown = view === 'current' ? current : past
  const live = list.filter((n) => n.status === 'live').length
  const scheduled = list.filter((n) => n.status === 'scheduled').length
  const seen = list.reduce((sum, n) => sum + n.counts.shown, 0)
  const opened = list.reduce((sum, n) => sum + n.counts.opened, 0)

  async function saveDraft(draft: NotificationDraft) {
    if (!editing) return null
    const editId = editing.mode === 'edit' && editing.from ? editing.from.id : null
    const message = editId !== null ? await save(editId, draft) : await create(draft)
    if (!message) {
      setEditing(null)
      setToast(editId !== null ? `Saved notification #${editId}.` : 'Notification saved.')
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

      <div className="card-grid cols-4">
        <NumberCard value={String(live)} label="Live now" icon="bell" tone="green" />
        <NumberCard value={String(scheduled)} label="Scheduled" icon="clock" tone="blue" />
        <NumberCard value={String(seen)} label="Seen" icon="users" tone="amber" />
        <NumberCard value={String(opened)} label="Opened" icon="answers" tone="violet" />
      </div>

      <Panel title="Messages">
        <Tabs<View>
          label="Notification lists"
          value={view}
          onChange={setView}
          tabs={[
            { id: 'current', label: `Live and scheduled (${current.length})` },
            { id: 'past', label: `Ended and stopped (${past.length})` },
          ]}
        />

        {shown.length === 0 ? (
          <p className="muted nt-empty">
            {view === 'current'
              ? 'Nothing is showing or scheduled right now. Use New notification to add one.'
              : 'No notifications have ended or been stopped yet.'}
          </p>
        ) : (
          <NotificationTable
            items={shown}
            onEdit={(n) => setEditing({ mode: 'edit', from: n })}
            onCopy={(n) => setEditing({ mode: 'create', from: n })}
            onStop={setStopping}
          />
        )}
      </Panel>

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