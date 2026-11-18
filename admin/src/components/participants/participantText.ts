import type { CSSProperties } from 'react'
import type { Participant, ParticipantsResponse, TrackingChange, TrackingStatus } from '../../types/participants'
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

// The short line at the bottom of a card.
export function statusLine(p: Participant): string {
  const since = p.tracking.changedAt ? shortDay(p.tracking.changedAt) : null
  if (p.status === 'on') return since ? `Tracking back on since ${since}` : 'Tracking on since they joined'
  if (p.status === 'off_self') return since ? `Turned off by them on ${since}` : 'Turned off by them in Settings'
  return since ? `Turned off by an admin on ${since}` : 'Turned off by an admin'
}

// "2 books, latest Oct 2", or "No tracked books yet"
export function booksLine(p: Participant): string {
  if (p.books === 0) return 'No tracked books yet'
  return `${plural(p.books, 'book', 'books')}, latest ${p.latestBookAt ? shortDay(p.latestBookAt) : ''}`
}

// Card stats: book count and latest book date.
export const booksCount = (p: Participant) => (p.books === 0 ? null : p.books.toLocaleString())
export const latestBook = (p: Participant) => (p.latestBookAt ? shortDay(p.latestBookAt) : null)

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

// The first letter after "VB2-", for the round badge.
export function initialOf(researchId: string): string {
  const rest = researchId.replace(/^VB2-/, '')
  return rest.charAt(0) || '?'
}

// Soft color pairs for the badge. Picked from the research ID, so a person
// keeps the same color on every visit. Green and orange are left out; they
// mean tracking status.
const ID_COLORS: readonly { bg: string; fg: string }[] = [
  { bg: '#dce8fb', fg: '#1e4e8c' },
  { bg: '#f6e3c3', fg: '#7a4a0a' },
  { bg: '#e9ddf7', fg: '#55308a' },
  { bg: '#d6eef8', fg: '#0b5372' },
  { bg: '#fadadd', fg: '#8a2433' },
  { bg: '#e3e6ee', fg: '#3a4256' },
  { bg: '#efe6da', fg: '#5e4630' },
  { bg: '#f7dcef', fg: '#7a2160' },
]

export function idStyle(researchId: string): CSSProperties {
  const key = researchId.replace(/^VB2-/, '')
  let hash = 0
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) % 9973
  const color = ID_COLORS[hash % ID_COLORS.length]
  return { '--pt-id-bg': color.bg, '--pt-id-fg': color.fg } as CSSProperties
}

// The line under "6 of 6 tracked" in the banner, and its status tone.
export function trackingNote(counts: ParticipantsResponse['counts']): { text: string; tone: TrackingStatus } {
  if (counts.all === 0) return { text: 'No participants yet', tone: 'off_admin' }
  if (counts.offSelf === 0 && counts.offAdmin === 0) return { text: 'Everyone is on', tone: 'on' }
  const parts: string[] = []
  if (counts.offSelf > 0) parts.push(`${counts.offSelf.toLocaleString()} turned off by them`)
  if (counts.offAdmin > 0) parts.push(`${counts.offAdmin.toLocaleString()} turned off by an admin`)
  return { text: parts.join(', '), tone: counts.offSelf > 0 ? 'off_self' : 'off_admin' }
}