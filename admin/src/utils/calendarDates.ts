// Day and time helpers for the notification calendar. A day is a Date at
// local midnight; a time is "HH:mm" in the viewer's own time zone.

const pad = (n: number) => String(n).padStart(2, '0')

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

// Same day of the month, or the month's last day when it is shorter.
export function addMonths(d: Date, n: number): Date {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  return new Date(first.getFullYear(), first.getMonth(), Math.min(d.getDate(), last))
}

export function sameDay(a: Date | null, b: Date | null): boolean {
  return (
    a !== null &&
    b !== null &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// The month as calendar cells, Sunday first, with null for blank cells.
export function monthCells(year: number, month: number): (Date | null)[] {
  const lead = new Date(year, month, 1).getDay()
  const count = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= count; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function atTime(day: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m)
}

export function timeOf(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function timeLabel(time: string): string {
  return atTime(new Date(2000, 0, 1), time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Every 15 minutes, plus 11:59 PM for "end of the day".
export function timeOptions(): string[] {
  const list: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) list.push(`${pad(h)}:${pad(m)}`)
  }
  list.push('23:59')
  return list
}

// Friday, November 20 at 11:59 PM (the year is added when it is not this year).
export function longDateTime(d: Date): string {
  const thisYear = d.getFullYear() === new Date().getFullYear()
  const day = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: thisYear ? undefined : 'numeric',
  })
  return `${day} at ${timeLabel(timeOf(d))}`
}

// 14 days, 3 hours, 25 minutes.
export function spanText(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000))
  if (minutes < 1) return 'less than a minute'
  if (minutes < 60) return minutes === 1 ? '1 minute' : `${minutes} minutes`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return hours === 1 ? '1 hour' : `${hours} hours`
  const days = Math.round(hours / 24)
  return `${days} days`
}

// The viewer's time zone, such as Eastern Standard Time.
export function zoneName(): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'long' }).formatToParts(new Date())
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
}