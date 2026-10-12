import type { StudySummary } from '../../types/studies'

// The math behind the study timeline on the Studies page.
//
// The timeline shows one calendar year, January 1 to December 31. Months
// are as wide as their days, so February is a little narrower than March.
//
//   A study inside the year      placed by its dates
//   A study crossing New Year    cut at the edge of the year, and marked so
//                                the bar shows it goes on before or after
//   A study in another year      not on this year's bar
//   Today                        a dashed line, only on the current year
//
// Positions are percentages (0 to 100) from the left edge.

export type TimelineMonth = {
  at: number // percent
  label: string // "Jan" ... "Dec"
}

export type TimelineBarSpan = {
  study: StudySummary
  left: number // percent
  width: number // percent
  cutStart: boolean // began in an earlier year
  cutEnd: boolean // goes on into a later year
}

export type TimelineScale = {
  months: TimelineMonth[]
  bars: TimelineBarSpan[]
  today: number | null // percent, or null when the year is not this year
}

const MIN_WIDTH = 0.6 // percent, about two days, so a study of a few hours still shows

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const startOf = (s: StudySummary) => new Date(s.startedAt).getTime()
const endOf = (s: StudySummary, now: Date) => (s.endedAt ? new Date(s.endedAt).getTime() : now.getTime())

// True if any part of the study falls inside the year.
export function inYear(study: StudySummary, year: number, now: Date): boolean {
  const from = new Date(year, 0, 1).getTime()
  const to = new Date(year + 1, 0, 1).getTime()
  return startOf(study) < to && endOf(study, now) >= from
}

// The years the arrows can move between: from the year of the first study
// to this year (or the year the last study ends, if that is later).
export function yearRange(studies: StudySummary[], now: Date): { first: number; last: number } {
  const thisYear = now.getFullYear()
  if (studies.length === 0) return { first: thisYear, last: thisYear }
  const first = Math.min(thisYear, ...studies.map((s) => new Date(startOf(s)).getFullYear()))
  const last = Math.max(thisYear, ...studies.map((s) => new Date(endOf(s, now)).getFullYear()))
  return { first, last }
}

export function timelineScale(studies: StudySummary[], year: number, now: Date): TimelineScale {
  const from = new Date(year, 0, 1).getTime()
  const to = new Date(year + 1, 0, 1).getTime()
  const span = to - from
  const pct = (t: number) => Math.min(100, Math.max(0, ((t - from) / span) * 100))

  const months = monthNames.map((label, i) => ({ at: pct(new Date(year, i, 1).getTime()), label }))

  const bars = studies
    .filter((s) => inYear(s, year, now))
    .map((study) => {
      const start = startOf(study)
      const end = endOf(study, now)
      const left = pct(start)
      const right = pct(end)
      return {
        study,
        left,
        width: Math.min(100 - left, Math.max(MIN_WIDTH, right - left)),
        cutStart: start < from,
        cutEnd: end >= to,
      }
    })

  const today = now.getFullYear() === year ? pct(now.getTime()) : null

  return { months, bars, today }
}