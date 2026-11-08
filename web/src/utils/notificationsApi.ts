import type { Lang } from '../i18n/language'
import { apiFetch } from './api'

// Messages for the signed-in account or guest (see
// api/Notifications/NotificationsController.cs).

export type NotificationId = number | string

// The playlist a message opens, in the site language, with this account's
// Keep or Skip so far.
export type NotificationPlaylist = {
  id: number
  name: string
  tips: number
  recipes: number
  choice: 'kept' | 'skipped' | null
}

export type NotificationItem = {
  id: NotificationId
  // Which repeat of the message this is. Each round pops up again.
  round: number
  text: string
  sentAt: string
  expiresAt: string
  // The pop-up has already shown this round.
  shown: boolean
  // The message has been opened on the Notifications screen.
  read: boolean
  playlist?: NotificationPlaylist | null
}

export type NotificationFeed = {
  unread: number
  items: NotificationItem[]
}

export type NotificationStep = 'seen' | 'open' | 'link' | 'close'

export function fetchNotifications(lang: Lang) {
  return apiFetch<NotificationFeed>(`/notifications?lang=${lang}`)
}

export function sendNotificationStep(
  id: NotificationId,
  step: NotificationStep,
  round: number,
) {
  return apiFetch<void>(`/notifications/${encodeURIComponent(String(id))}/${step}`, {
    method: 'POST',
    body: { round },
  })
}