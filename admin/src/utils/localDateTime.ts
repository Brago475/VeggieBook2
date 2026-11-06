// Converts between ISO dates from the API and the value of an
// <input type="datetime-local">, which is in the viewer's own time zone.

const pad = (n: number) => String(n).padStart(2, '0')

export function toInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// A value without an offset is read as local time.
export function fromInputValue(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export function nowInputValue(): string {
  const d = new Date()
  d.setSeconds(0, 0)
  return toInputValue(d.toISOString())
}