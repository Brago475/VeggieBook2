import type { Lang } from '../i18n/language'

// Dates and times for notifications, in the page language and the
// device's time zone.

function locale(lang: Lang): string {
  return lang === 'es' ? 'es-US' : 'en-US'
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function thisYear(d: Date): boolean {
  return d.getFullYear() === new Date().getFullYear()
}

export function isToday(iso: string): boolean {
  return dayKey(new Date(iso)) === dayKey(new Date())
}

// 5:14 PM
export function timeOf(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleTimeString(locale(lang), {
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Nov 3, or Nov 3, 2025 for another year.
export function shortDate(iso: string, lang: Lang): string {
  const d = new Date(iso)
  return d.toLocaleDateString(
    locale(lang),
    thisYear(d) ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' },
  )
}

// Sun, Nov 8, 11:16 AM
export function dayAndTime(iso: string, lang: Lang): string {
  const d = new Date(iso)
  const day = d.toLocaleDateString(locale(lang), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: thisYear(d) ? undefined : 'numeric',
  })
  return `${day}, ${timeOf(iso, lang)}`
}

// The time for today's notifications, the date for older ones.
export function listTime(iso: string, lang: Lang): string {
  return isToday(iso) ? timeOf(iso, lang) : shortDate(iso, lang)
}