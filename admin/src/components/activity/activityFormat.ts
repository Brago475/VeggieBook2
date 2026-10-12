import type { ActivityEvent, ActivityType } from '../../types/activity'

// Filter groups, day grouping, and CSV rows for the Activity page.

export type ActivityGroup = 'all' | 'saved' | 'joined' | 'book_deleted' | 'account_deleted' | 'tracking' | 'studies' | 'notice'

export const groups: { id: ActivityGroup; label: string; types: ActivityType[] }[] = [
  { id: 'all', label: 'All', types: [] },
  { id: 'saved', label: 'Books saved', types: ['book_saved'] },
  { id: 'joined', label: 'Joined', types: ['joined'] },
  { id: 'book_deleted', label: 'Books deleted', types: ['book_deleted'] },
  { id: 'account_deleted', label: 'Accounts deleted', types: ['account_deleted'] },
  { id: 'tracking', label: 'Tracking', types: ['tracking_on', 'tracking_off'] },
  { id: 'studies', label: 'Studies', types: ['study_started', 'study_ended'] },
  { id: 'notice', label: 'Study notice', types: ['notice_joined', 'notice_declined'] },
]

export function inGroup(e: ActivityEvent, group: ActivityGroup): boolean {
  return group === 'all' || (groups.find((g) => g.id === group)?.types.includes(e.type) ?? false)
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
    ['Date', 'Time', 'Type', 'Research ID', 'Event', 'Detail'],
    ...events.map((e) => [localDate(e.at), timeLabel(e.at), e.type, e.researchId ?? 'Admin', e.title, e.detail]),
  ]
}