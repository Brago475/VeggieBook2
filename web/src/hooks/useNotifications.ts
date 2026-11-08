import { useCallback, useEffect, useRef, useState } from 'react'
import { useLang } from '../i18n/languageContext'
import {
  fetchNotifications,
  sendNotificationStep,
  type NotificationItem,
  type NotificationStep,
} from '../utils/notificationsApi'

// Notifications from the research team for the current account or guest.
//
// Checks once a minute while the tab is visible, and again when the tab
// comes back into view. Each step (seen, open, link, close) is sent to the
// API, which records it in the activity log for tracked accounts.
//
// The pop-up holds every unseen notification at once, newest first, and
// opens only while `calm` is true, so it never interrupts making a book or a
// form. All of them count as shown when it opens, and as closed on Close.
// A notification counts as opened when its own page is opened.

const POLL_MS = 60_000

export function notificationKey(item: NotificationItem): string {
  return `${item.id}:${item.round}`
}

function newestFirst(list: NotificationItem[]): NotificationItem[] {
  return [...list].sort((a, b) => Date.parse(b.sentAt) - Date.parse(a.sentAt))
}

// Tracking never blocks or breaks the screen.
function send(item: NotificationItem, step: NotificationStep) {
  sendNotificationStep(item.id, step, item.round).catch(() => {})
}

export function useNotifications(owner: string | null, calm: boolean) {
  const { lang } = useLang()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [batch, setBatch] = useState<NotificationItem[]>([])

  // Steps already sent this visit, so a check that lands before the server
  // has recorded them does not undo them on screen.
  const seenSent = useRef(new Set<string>())
  const openSent = useRef(new Set<string>())
  const batchRef = useRef<NotificationItem[]>([])

  useEffect(() => {
    batchRef.current = batch
  }, [batch])

  // A different account or guest starts clean.
  useEffect(() => {
    setItems([])
    setLoaded(false)
    setError(null)
    setBatch([])
    seenSent.current = new Set()
    openSent.current = new Set()
  }, [owner])

  useEffect(() => {
    if (!owner) return
    let active = true

    async function load() {
      try {
        const feed = await fetchNotifications(lang)
        if (!active) return
        setItems(
          newestFirst(feed.items).map((item) => {
            const key = notificationKey(item)
            const opened = openSent.current.has(key)
            return {
              ...item,
              shown: item.shown || opened || seenSent.current.has(key),
              read: item.read || opened,
            }
          }),
        )
        setError(null)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'error')
      } finally {
        if (active) setLoaded(true)
      }
    }

    function onVisible() {
      if (document.visibilityState === 'visible') load()
    }

    load()
    const timer = window.setInterval(onVisible, POLL_MS)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [owner, lang])

  // Opens the pop-up with every unseen notification and records each as shown.
  useEffect(() => {
    if (!calm || batch.length > 0) return
    const fresh = items.filter(
      (item) => !item.shown && !seenSent.current.has(notificationKey(item)),
    )
    if (fresh.length === 0) return

    for (const item of fresh) {
      seenSent.current.add(notificationKey(item))
      send(item, 'seen')
    }
    setBatch(fresh)
    setItems((list) =>
      list.map((item) =>
        seenSent.current.has(notificationKey(item)) ? { ...item, shown: true } : item,
      ),
    )
  }, [calm, batch.length, items])

  // Close: every notification in the pop-up counts as closed.
  const closeBatch = useCallback(() => {
    for (const item of batchRef.current) send(item, 'close')
    setBatch([])
  }, [])

  // Leaving the pop-up for Notifications: the open is recorded there.
  const leaveBatch = useCallback(() => {
    setBatch([])
  }, [])

  // One notification's page was opened.
  const openOne = useCallback((item: NotificationItem) => {
    const key = notificationKey(item)
    if (item.read || openSent.current.has(key)) return
    openSent.current.add(key)
    send(item, 'open')
    setItems((list) =>
      list.map((i) => (notificationKey(i) === key ? { ...i, read: true, shown: true } : i)),
    )
  }, [])

  const followLink = useCallback((item: NotificationItem) => {
    send(item, 'link')
  }, [])

  const unread = items.filter((item) => !item.read).length

  return {
    items,
    loaded,
    error,
    unread,
    batch,
    closeBatch,
    leaveBatch,
    openOne,
    followLink,
  }
}