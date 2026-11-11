import type { ActivityEvent, ActivityType } from '../../types/activity'

// Filter groups, who-did-it filter, day grouping, and CSV rows for the
// Activity page.

export type ActivityGroup =
  | 'all'
  | 'saved'
  | 'taken_out'
  | 'printed'
  | 'joined'
  | 'book_deleted'
  | 'account_deleted'
  | 'erased'
  | 'tracking'
  | 'studies'
  | 'notice'
  | 'notifications'
  | 'playlists'
  | 'admin_site'

export const groups: { id: ActivityGroup; label: string; types: ActivityType[] }[] = [
  { id: 'all', label: 'All', types: [] },
  { id: 'saved', label: 'Books saved', types: ['book_saved'] },
  { id: 'taken_out', label: 'Taken out', types: ['item_removed'] },
  { id: 'printed', label: 'Printed and downloaded', types: ['book_printed', 'book_downloaded'] },
  { id: 'joined', label: 'Joined', types: ['joined'] },
  { id: 'book_deleted', label: 'Books deleted', types: ['book_deleted'] },
  { id: 'account_deleted', label: 'Accounts deleted', types: ['account_deleted'] },
  { id: 'erased', label: 'Erased', types: ['research_erased'] },
  { id: 'tracking', label: 'Tracking', types: ['tracking_on', 'tracking_off'] },
  { id: 'studies', label: 'Studies', types: ['study_started', 'study_ended', 'study_renamed', 'study_deleted'] },
  { id: 'notice', label: 'Study notice', types: ['notice_joined', 'notice_declined'] },
  {
    id: 'notifications',
    label: 'Notifications',
    types: [
      'notification_shown',
      'notification_opened',
      'notification_link',
      'notification_dismissed',
      'notification_created',
      'notification_edited',
      'notification_stopped',
    ],
  },
  {
    id: 'playlists',
    label: 'Playlists',
    types: [
      'playlist_created',
      'playlist_edited',
      'playlist_archived',
      'playlist_opened',
      'playlist_kept',
      'playlist_skipped',
      'playlist_removed',
      'playlist_item_opened',
      'user_playlist_created',
      'user_playlist_edited',
      'user_playlist_deleted',
      'meal_labels_changed',
    ],
  },
  {
    id: 'admin_site',
    label: 'Admin access and site',
    types: [
      'admin_role_given',
      'admin_role_removed',
      'recovery_unlocked',
      'guest_mode_changed',
      'signed_out_everywhere',
      'admin_download',
    ],
  },
]

export function inGroup(e: ActivityEvent, group: ActivityGroup): boolean {
  return group === 'all' || (groups.find((g) => g.id === group)?.types.includes(e.type) ?? false)
}

// Who did it: everyone, participants only, or admin actions only.
export type ActivityWho = 'all' | 'participants' | 'admins'

export const whoOptions: { id: ActivityWho; label: string }[] = [
  { id: 'all', label: 'Everyone' },
  { id: 'participants', label: 'Participants' },
  { id: 'admins', label: 'Admin actions' },
]

export function byWho(e: ActivityEvent, who: ActivityWho): boolean {
  if (who === 'participants') return !e.byAdmin
  if (who === 'admins') return e.byAdmin
  return true
}

// The admin's name as shown: username, Former admin, or a plain label for
// lines written before admins were recorded.
export function adminLabel(e: ActivityEvent): string {
  return e.admin ?? 'an admin'
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar date, "yyyy-MM-dd". */
export function localDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** "Today, Sunday, October 11" or "Saturday, October 10, 2025". */
export function dayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const day = new Date(y, m - 1, d)
  const today = localDate(new Date().toISOString())
  const text = day.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: y === new Date().getFullYear() ? undefined : 'numeric',
  })
  return date === today ? `Today, ${text}` : text
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function csvRows(events: ActivityEvent[]): (string | number)[][] {
  return [
    ['Date', 'Time', 'Type', 'Research ID', 'Event', 'Detail', 'By admin'],
    ...events.map((e) => [
      localDate(e.at),
      timeLabel(e.at),
      e.type,
      e.researchId ?? '',
      e.title,
      e.detail,
      e.byAdmin ? adminLabel(e) : '',
    ]),
  ]
}