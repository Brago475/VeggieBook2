import { useCallback, useEffect, useState } from 'react'
import { useHashParam } from '../../hooks/useHashParam'
import { useHeld } from '../../hooks/useHeld'
import { useNotifications } from '../../hooks/useNotifications'
import type { AdminNotification, NotificationDraft } from '../../types/notifications'
import { NavIcon } from '../icons/NavIcons'
import { TopbarActions } from '../layout/TopbarSlot'
import { MessagesSkeleton } from '../skeletons/MessagesSkeleton'
import { StudyToast } from '../studies/StudyToast'
import { NotificationEditor } from './NotificationEditor'
import { notificationName } from './notificationFormat'
import { NotificationList } from './NotificationList'
import { NotificationStats } from './NotificationStats'
import { RenameNotificationDialog } from './RenameNotificationDialog'
import { StopNotificationDialog } from './StopNotificationDialog'

// Messages section of the Notifications page. Stat cards on top, then one
// card per message under Live and scheduled / Ended and stopped; the chosen
// list is kept in the address. Each message can carry an admin-only title.
// A playlist sent from the Playlists section opens a new message with that
// playlist chosen. While loading, the section's outline shows.

type Editing = { mode: 'create' | 'edit'; from: AdminNotification | null; playlistId?: number | null }
type View = 'current' | 'past'

const VIEWS: readonly View[] = ['current', 'past']

type Props = {
  // A playlist to start a new message with, from Send on a playlist card.
  sendPlaylistId?: number | null
  onSendOpened?: () => void
}

export function MessagesSection({ sendPlaylistId = null, onSendOpened }: Props) {
  const { list, templates, error, create, save, rename, stop } = useNotifications()
  const [view, setView] = useHashParam('list', VIEWS)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [renaming, setRenaming] = useState<AdminNotification | null>(null)
  const [stopping, setStopping] = useState<AdminNotification | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const closeToast = useCallback(() => setToast(null), [])
  const closeEditor = useCallback(() => setEditing(null), [])
  const closeRename = useCallback(() => setRenaming(null), [])
  const closeStop = useCallback(() => setStopping(null), [])
  const firstLoad = useHeld(!list && !error)

  useEffect(() => {
    if (sendPlaylistId === null) return
    setEditing({ mode: 'create', from: null, playlistId: sendPlaylistId })
    onSendOpened?.()
  }, [sendPlaylistId, onSendOpened])

  if (!list && error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    )
  }

  if (firstLoad || !list || !templates) return <MessagesSkeleton />

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
    <>
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
          playlistId={editing.playlistId ?? null}
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
    </>
  )
}