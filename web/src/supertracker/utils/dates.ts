// Calendar days on this device, as yyyy-MM-dd.

export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, days: number): string {
  const date = toDate(key)
  date.setDate(date.getDate() + days)
  return todayKey(date)
}

export function longDate(key: string, locale: string): string {
  return toDate(key).toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

// "Today", "Yesterday", or the weekday and date.
export function dayLabel(key: string, locale: string, words: { today: string; yesterday: string }): string {
  const today = todayKey()
  if (key === today) return words.today
  if (key === addDays(today, -1)) return words.yesterday
  return longDate(key, locale)
}