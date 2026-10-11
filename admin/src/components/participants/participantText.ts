import type { Participant, TrackingChange, TrackingStatus } from '../../types/participants'
import { brief, fullDate, fullDateTime, plural } from '../studies/studyFormat'

// The words the Participants page uses for a person, in one place, so the
// cards and the side panel always say the same thing. Dates are Eastern.

export const statusLabel: Record<TrackingStatus, string> = {
  on: 'Tracking on',
  off_self: 'Turned off by them',
  off_admin: 'Turned off by an admin',
}

const ZONE = 'America/New_York'
const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: ZONE })

// "Oct 3"
export const shortDay = (iso: string) => monthDay.format(new Date(iso))

// "Age 25-34, joined Sep 28"
export function aboutLine(p: Participant): string {
  return `Age ${p.ageRange ?? 'not given'}, joined ${shortDay(p.joinedAt)}`
}

// One line under the status chip on a card.
export function statusLine(p: Participant): string {
  const since = p.tracking.changedAt ? shortDay(p.tracking.changedAt) : null
  if (p.status === 'on') return since ? `Back on since ${since}` : 'On since they joined'
  if (p.status === 'off_self') return since ? `Turned off in Settings ${since}` : 'Turned off in Settings'
  return since ? `Turned off by an admin ${since}` : 'Turned off by an admin'
}

// "2 books, latest Oct 2", or "No tracked books yet"
export function booksLine(p: Participant): string {
  if (p.books === 0) return 'No tracked books yet'
  return `${plural(p.books, 'book', 'books')}, latest ${p.latestBookAt ? shortDay(p.latestBookAt) : ''}`
}

// For the panel's list of changes.
export function changeText(c: TrackingChange): string {
  const who = c.by === 'admin' ? 'by an admin' : 'by them in Settings'
  return `${c.on ? 'Turned on' : 'Turned off'} ${who}`
}

export function changeWhen(c: TrackingChange): string {
  return fullDateTime(c.at)
}

// What happened with the running study's notice.
export function noticeText(p: Participant): string | null {
  if (!p.notice) return null
  if (p.notice.answer === 'joined') return `Joined from the notice, ${brief(p.notice.answeredAt ?? p.notice.shownAt)}`
  if (p.notice.answer === 'stayed_out') return `Stayed out, ${brief(p.notice.answeredAt ?? p.notice.shownAt)}`
  return `Saw it ${brief(p.notice.shownAt)}, hasn't answered`
}

export const joinedText = (p: Participant) => fullDate(p.joinedAt)

// The first letter after "VB2-", for the small square on each card.
export function initialOf(researchId: string): string {
  const rest = researchId.replace(/^VB2-/, '')
  return rest.charAt(0) || '?'
}