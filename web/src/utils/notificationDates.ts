import type { Lang } from '../i18n/language'

// Dates and times for messages, in the page language and the device's
// time zone.

function locale(lang: Lang): string {
  return lang === 'es' ? 'es-US' : 'en-US'
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function isToday(iso: string): boolean {
  return dayKey(new Date(iso)) === dayKey(new Date())
}

export function sameDay(a: string, b: string): boolean {
  return dayKey(new Date(a)) === dayKey(new Date(b))
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
  const thisYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString(
    locale(lang),
    thisYear
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' },
  )
}

// The time for today's messages, the date for older ones.
export function listTime(iso: string, lang: Lang): string {
  return isToday(iso) ? timeOf(iso, lang) : shortDate(iso, lang)
}