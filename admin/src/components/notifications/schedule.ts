import { atTime } from '../../utils/calendarDates'

// The editor's When settings, and the start and end they work out to.
//
//   now    starts the moment Send is clicked; the server sets the time
//   later  starts on the picked day and time; one that has passed starts now
//   fixed  a message that already started keeps its start

export type StartMode = 'now' | 'later' | 'fixed'

export type Schedule = {
  startMode: StartMode
  startDay: Date | null
  startTime: string
  endDay: Date | null
  endTime: string
  repeatOn: boolean
  repeatDays: string
}

export function startPassed(s: Schedule, now: Date): boolean {
  return s.startMode === 'later' && s.startDay !== null && atTime(s.startDay, s.startTime) <= now
}

export function startAt(s: Schedule, now: Date, fixedStart: Date | null): Date | null {
  if (s.startMode === 'now') return now
  if (s.startMode === 'fixed') return fixedStart
  if (!s.startDay) return null
  const at = atTime(s.startDay, s.startTime)
  return at < now ? now : at
}

export function endAt(s: Schedule): Date | null {
  return s.endDay ? atTime(s.endDay, s.endTime) : null
}