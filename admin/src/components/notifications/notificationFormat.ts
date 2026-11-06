import type {
  AdminNotification,
  NotificationStatus,
  NotificationTemplate,
  NotificationVegetable,
} from '../../types/notifications'

// Labels and helpers shared by the Notifications page.

export const MAX_BODY = 500

export const statusLabel: Record<NotificationStatus, string> = {
  scheduled: 'Scheduled',
  live: 'Live',
  ended: 'Ended',
  stopped: 'Stopped',
}

export function statusClass(status: NotificationStatus): string {
  if (status === 'live') return 'is-ok'
  if (status === 'stopped') return 'is-warn'
  return 'is-off'
}

// A template's English with the vegetable filled in. Without a vegetable
// the slot stays, which the editor treats as not ready.
export function fillTemplate(
  template: NotificationTemplate,
  vegetable: NotificationVegetable | null,
  slot: string,
): string {
  if (!template.needsVegetable || !vegetable) return template.en
  return template.en.replace(slot, vegetable.en)
}

export function audienceText(n: AdminNotification): string {
  const base =
    n.audience === 'selected'
      ? `${n.includeIds.length} selected ${n.includeIds.length === 1 ? 'account' : 'accounts'}`
      : n.excludeIds.length > 0
        ? `All accounts except ${n.excludeIds.length}`
        : 'All accounts'
  return n.includeGuests ? `${base}, plus guests` : base
}

export function repeatText(days: number | null): string {
  if (days === null) return 'Once'
  return days === 1 ? 'Every day' : `Every ${days} days`
}

export function hasLink(text: string): boolean {
  return /https:\/\/\S/.test(text)
}