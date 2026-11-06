import { useCallback, useEffect, useRef, useState } from 'react'
import { useLang } from '../i18n/languageContext'
import {
  fetchNotifications,
  sendNotificationStep,
  type NotificationItem,
  type NotificationStep,
} from '../utils/notificationsApi'

// Messages from the research team for the current account or guest.
//
// Checks once a minute while the tab is visible, and again when the tab
// comes back into view. Each step (seen, open, link, close) is sent to the
// API, which records it in the activity log for tracked accounts.
//
// The pop-up shows one unseen message at a time, newest first, and only
// while `calm` is true, so it never interrupts making a book or a form.

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
  const [current, setCurrent] = useState<NotificationItem | null>(null)

  // Steps already sent this visit, so a check that lands before the server
  // has recorded them does not undo them on screen.
  const seenSent = useRef(new Set<string>())
  const openSent = useRef(new Set<string>())
  const itemsRef = useRef<NotificationItem[]>([])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  // A different account or guest starts clean.
  useEffect(() => {
    setItems([])
    setLoaded(false)
    setError(null)
    setCurrent(null)
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

  // Picks the next message for the pop-up and records that it was shown.
  useEffect(() => {
    if (!calm || current) return
    const next = items.find(
      (item) => !item.shown && !seenSent.current.has(notificationKey(item)),
    )
    if (!next) return

    const key = notificationKey(next)
    seenSent.current.add(key)
    send(next, 'seen')
    setCurrent(next)
    setItems((list) =>
      list.map((item) => (notificationKey(item) === key ? { ...item, shown: true } : item)),
    )
  }, [calm, current, items])

  const closeCurrent = useCallback(() => {
    if (current) send(current, 'close')
    setCurrent(null)
  }, [current])

  // View leads to the Notifications screen, which records the open.
  const viewCurrent = useCallback(() => {
    setCurrent(null)
  }, [])

  const openAll = useCallback(() => {
    const unread = itemsRef.current.filter(
      (item) => !item.read && !openSent.current.has(notificationKey(item)),
    )
    if (unread.length === 0) return

    for (const item of unread) {
      openSent.current.add(notificationKey(item))
      send(item, 'open')
    }
    setItems((list) =>
      list.map((item) =>
        openSent.current.has(notificationKey(item))
          ? { ...item, read: true, shown: true }
          : item,
      ),
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
    current,
    closeCurrent,
    viewCurrent,
    openAll,
    followLink,
  }
}