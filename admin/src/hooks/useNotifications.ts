import { useCallback, useEffect, useState } from 'react'
import type { AdminNotification, NotificationDraft, TemplatesResponse } from '../types/notifications'
import { api, isChanged } from '../utils/api'

// Loads the Notifications page and runs create, edit, rename, and stop.
// After each change the list loads again so counts and statuses match the
// server. It also reloads every minute while the tab is visible, so a
// scheduled message turns live and counts move without a refresh. A failed
// change returns the API's message for the page to show.
//
// Edit and rename send the version the admin was looking at. If another
// admin saved first, the change is refused, the list reloads, and the
// message asks to reopen it.

const REFRESH_MS = 60_000

const CHANGED =
  'Another admin saved changes to this notification first. Close this window and open it again to see them.'

export function useNotifications() {
  const [list, setList] = useState<AdminNotification[] | null>(null)
  const [templates, setTemplates] = useState<TemplatesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [items, tpl] = await Promise.all([
        api<AdminNotification[]>('/admin/notifications'),
        api<TemplatesResponse>('/admin/notifications/templates'),
      ])
      setList(items)
      setTemplates(tpl)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [load])

  const change = useCallback(
    async (run: () => Promise<unknown>): Promise<string | null> => {
      try {
        await run()
        await load()
        return null
      } catch (err) {
        await load()
        return isChanged(err) ? CHANGED : (err as Error).message
      }
    },
    [load],
  )

  const create = useCallback(
    (draft: NotificationDraft) =>
      change(() => api('/admin/notifications', { method: 'POST', body: draft })),
    [change],
  )

  const save = useCallback(
    (id: number, draft: NotificationDraft) =>
      change(() => api(`/admin/notifications/${id}`, { method: 'PUT', body: draft })),
    [change],
  )

  // Uses the version of the message as the page shows it.
  const rename = useCallback(
    (id: number, title: string | null) => {
      const version = list?.find((n) => n.id === id)?.version ?? null
      return change(() =>
        api(`/admin/notifications/${id}/title`, { method: 'PUT', body: { title, version } }),
      )
    },
    [change, list],
  )

  const stop = useCallback(
    (id: number) => change(() => api(`/admin/notifications/${id}/stop`, { method: 'POST' })),
    [change],
  )

  return { list, templates, error, reload: load, create, save, rename, stop }
}