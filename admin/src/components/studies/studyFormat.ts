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

export const fullDate = (iso: string) => longDate.format(new Date(iso))
export const fullDateTime = (iso: string) => longDateTime.format(new Date(iso))
export const brief = (iso: string) => shortDate.format(new Date(iso))

export const plural = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`

// "Oct 1, 2026 to Oct 24, 2026", or "Started Oct 1, 2026" while it runs.
export function studyDates(startedAt: string, endedAt: string | null): string {
  return endedAt ? `${brief(startedAt)} to ${brief(endedAt)}` : `Started ${brief(startedAt)}`
}