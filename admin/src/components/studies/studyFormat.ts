// Dates for the Studies and Participants pages, always in Eastern time and
// always with the day and month spelled out, so there is no doubt which day
// is meant.

const ZONE = 'America/New_York'

// "Thursday, October 1, 2026"
const longDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeZone: ZONE })

// "Thursday, October 1, 2026 at 8:00 AM"
const longDateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short', timeZone: ZONE })

// "Oct 1, 2026"
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: ZONE })

// "October 1" and "October 1, 2026"
const monthDay = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: ZONE })
const monthDayYear = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: ZONE })
const yearOnly = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: ZONE })

// "Oct 11, 2026, 8:02 PM"
const briefTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: ZONE,
})
const timeOnly = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: ZONE })
const dayOnly = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: ZONE })

export const fullDate = (iso: string) => longDate.format(new Date(iso))
export const fullDateTime = (iso: string) => longDateTime.format(new Date(iso))
export const brief = (iso: string) => shortDate.format(new Date(iso))

export const plural = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`

// "Oct 1, 2026 to Oct 24, 2026", or "Started Oct 1, 2026" while it runs.
export function studyDates(startedAt: string, endedAt: string | null): string {
  return endedAt ? `${brief(startedAt)} to ${brief(endedAt)}` : `Started ${brief(startedAt)}`
}

// How long a study ran, in words, for the timeline:
//   "July 6 to July 24, 2026"
//   "December 14, 2026 to January 8, 2027"
//   "October 11, 2026 to now" while it runs
export function studyRange(startedAt: string, endedAt: string | null): string {
  const start = new Date(startedAt)
  if (!endedAt) return `${monthDayYear.format(start)} to now`

  const end = new Date(endedAt)
  return yearOnly.format(start) === yearOnly.format(end)
    ? `${monthDay.format(start)} to ${monthDayYear.format(end)}`
    : `${monthDayYear.format(start)} to ${monthDayYear.format(end)}`
}

// With times, so two studies on the same day are easy to tell apart:
//   "Oct 11, 2026, 7:40 PM to 7:58 PM"
//   "Oct 2, 2026, 9:00 AM to Oct 20, 2026, 5:15 PM"
//   "Oct 11, 2026, 8:02 PM to now"
export function studyRangeTimes(startedAt: string, endedAt: string | null): string {
  const start = new Date(startedAt)
  if (!endedAt) return `${briefTime.format(start)} to now`

  const end = new Date(endedAt)
  return dayOnly.format(start) === dayOnly.format(end)
    ? `${briefTime.format(start)} to ${timeOnly.format(end)}`
    : `${briefTime.format(start)} to ${briefTime.format(end)}`
}

// What the admin site calls a study: its name, or "Study 3" without one.
export function studyTitle(s: { number: number; name: string | null }): string {
  return s.name?.trim() ? s.name.trim() : `Study ${s.number}`
}

// "Fall pilot (Study 2)", or just "Study 2" without a name.
export function studyFullTitle(s: { number: number; name: string | null }): string {
  return s.name?.trim() ? `${s.name.trim()} (Study ${s.number})` : `Study ${s.number}`
}