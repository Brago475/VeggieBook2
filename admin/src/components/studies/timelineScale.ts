import type { StudySummary } from '../../types/studies'

// The math behind the study timeline on the Studies page.
//
// The timeline starts on the first day of the month the first study began
// and ends at the end of the month of today (or of the last study, if that
// is later). It always shows at least three months, so one short study
// isn't stretched across the whole bar.
//
// Positions are percentages (0 to 100) from the left edge.

export type TimelineMonth = {
  at: number // percent
  label: string // "Oct", or "Jan 2027" at the start of a year
  showLabel: boolean
}

export type TimelineBarSpan = {
  study: StudySummary
  left: number // percent
  width: number // percent
}

export type TimelineScale = {
  months: TimelineMonth[]
  bars: TimelineBarSpan[]
  today: number // percent
}

const MIN_MONTHS = 3
const MIN_WIDTH = 1 // percent, so a study of a few hours still shows
const MAX_LABELS = 12

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

export function timelineScale(studies: StudySummary[], now: Date): TimelineScale {
  const starts = studies.map((s) => new Date(s.startedAt).getTime())
  const ends = studies.map((s) => (s.endedAt ? new Date(s.endedAt).getTime() : now.getTime()))

  const first = starts.length ? new Date(Math.min(...starts)) : now
  const last = new Date(Math.max(now.getTime(), ...ends))

  const from = firstOfMonth(first)
  let to = addMonths(firstOfMonth(last), 1)
  if (to < addMonths(from, MIN_MONTHS)) to = addMonths(from, MIN_MONTHS)

  const span = to.getTime() - from.getTime()
  const pct = (t: number) => Math.min(100, Math.max(0, ((t - from.getTime()) / span) * 100))

  // One mark per month. On long timelines only every few get a label.
  const count = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth()
  const every = Math.ceil(count / MAX_LABELS)
  const months: TimelineMonth[] = []
  for (let i = 0; i < count; i++) {
    const m = addMonths(from, i)
    const name = monthNames[m.getMonth()]
    months.push({
      at: pct(m.getTime()),
      label: i === 0 || m.getMonth() === 0 ? `${name} ${m.getFullYear()}` : name,
      showLabel: i % every === 0,
    })
  }

  const bars = studies.map((study, i) => {
    const left = pct(starts[i])
    const right = pct(ends[i])
    return { study, left, width: Math.max(MIN_WIDTH, right - left) }
  })

  return { months, bars, today: pct(now.getTime()) }
}