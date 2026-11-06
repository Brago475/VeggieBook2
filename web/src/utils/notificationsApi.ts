import type { Lang } from '../i18n/language'
import { apiFetch } from './api'

// Messages for the signed-in account or guest (see
// api/Notifications/NotificationsController.cs).

export type NotificationId = number | string

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