import { useCallback, useState } from 'react'
import { NavIcon } from '../components/icons/NavIcons'
import { TopbarActions } from '../components/layout/TopbarSlot'
import { NotificationEditor } from '../components/notifications/NotificationEditor'
import { notificationName } from '../components/notifications/notificationFormat'
import { NotificationList } from '../components/notifications/NotificationList'
import { NotificationStats } from '../components/notifications/NotificationStats'
import { RenameNotificationDialog } from '../components/notifications/RenameNotificationDialog'
import { StopNotificationDialog } from '../components/notifications/StopNotificationDialog'
import { StudyToast } from '../components/studies/StudyToast'
import { useHeld } from '../hooks/useHeld'
import { useNotifications } from '../hooks/useNotifications'
import type { AdminNotification, NotificationDraft } from '../types/notifications'
import '../styles/studies.css'
import '../styles/studies-edit.css'
import '../styles/notifications.css'

// Notifications page: messages shown inside the main site, in a pop-up and
// in the Notifications section of its menu. Stat cards on top, then one
// card per message under Live and scheduled / Ended and stopped. Each
// message can carry an admin-only title. Buttons and dialogs share the
// Studies page styles.
// API: api/Admin/AdminNotificationsController.cs.

type Editing = { mode: 'create' | 'edit'; from: AdminNotification | null }
type View = 'current' | 'past'

export function Notifications() {
  const { list, templates, error, create, save, rename, stop } = useNotifications()
  const [view, setView] = useState<View>('current')
  const [editing, setEditing] = useState<Editing | null>(null)
  const [renaming, setRenaming] = useState<AdminNotification | null>(null)
  const [stopping, setStopping] = useState<AdminNotification | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const closeEditor = useCallback(() => setEditing(null), [])
  const closeRename = useCallback(() => setRenaming(null), [])
  const closeStop = useCallback(() => setStopping(null), [])
  const firstLoad = useHeld(!list && !error)

  if (!list && error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    )
  }

  if (firstLoad || !list || !templates) return <p className="st-muted">Loading notifications...</p>

  const current = list.filter((n) => n.status === 'live' || n.status === 'scheduled')
  const past = list.filter((n) => n.status === 'ended' || n.status === 'stopped')
  const shown = view === 'current' ? current : past
  const openNew = () => setEditing({ mode: 'create', from: null })

  async function saveDraft(draft: NotificationDraft) {
    if (!editing) return null
    const editId = editing.mode === 'edit' && editing.from ? editing.from.id : null
    const message = editId !== null ? await save(editId, draft) : await create(draft)
    if (!message) {
      setEditing(null)
      const name = draft.title ? `"${draft.title}"` : editId !== null ? `notification #${editId}` : 'the notification'
      setToast(`Saved ${name}.`)
    }
    return message
  }

  async function renameOne(item: AdminNotification, title: string | null) {
    const message = await rename(item.id, title)
    if (!message) setToast(title ? `Titled #${item.id} "${title}".` : `Removed the title from #${item.id}.`)
    return message
  }

  async function stopOne(item: AdminNotification) {
    const message = await stop(item.id)
    if (!message) setToast(`Stopped ${notificationName(item)}.`)
    return message
  }

  const tabs: { id: View; label: string; count: number }[] = [
    { id: 'current', label: 'Live and scheduled', count: current.length },
    { id: 'past', label: 'Ended and stopped', count: past.length },
  ]

  return (
    <div className="nt-page">
      <TopbarActions>
        <button type="button" className="st-button is-green" onClick={openNew}>
          <NavIcon name="bell" size={16} />
          New notification
        </button>
      </TopbarActions>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <NotificationStats list={list} />

      <section className="nt-list">
        <div className="nt-list-head">
          <strong className="nt-list-title">Messages</strong>
          <div className="nt-tabs" role="tablist" aria-label="Notification lists">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={view === t.id}
                className={view === t.id ? 'nt-tab is-active' : 'nt-tab'}
                onClick={() => setView(t.id)}
              >
                {t.label}
                <span className="nt-tab-count">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="nt-empty">
            <p className="st-muted">
              {view === 'current'
                ? 'Nothing is showing or scheduled right now.'
                : 'No notifications have ended or been stopped yet.'}
            </p>
            {view === 'current' && (
              <button type="button" className="st-button is-green" onClick={openNew}>
                <NavIcon name="bell" size={16} />
                New notification
              </button>
            )}
          </div>
        ) : (
          <NotificationList
            items={shown}
            onEdit={(n) => setEditing({ mode: 'edit', from: n })}
            onCopy={(n) => setEditing({ mode: 'create', from: n })}
            onRename={setRenaming}
            onStop={setStopping}
          />
        )}
      </section>

      {editing && (
        <NotificationEditor
          mode={editing.mode}
          from={editing.from}
          templates={templates}
          onSave={saveDraft}
          onClose={closeEditor}
        />
      )}

      {renaming && (
        <RenameNotificationDialog
          item={renaming}
          onSave={(title) => renameOne(renaming, title)}
          onClose={closeRename}
        />
      )}

      {stopping && (
        <StopNotificationDialog item={stopping} onStop={() => stopOne(stopping)} onClose={closeStop} />
      )}

      {toast && <StudyToast message={toast} onClose={closeToast} />}
    </div>
  )
}