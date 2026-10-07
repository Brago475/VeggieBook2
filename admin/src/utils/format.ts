// Turns the API's ISO dates into readable US-style text.
// Shown in the viewer's own time zone.

const dateOnly = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })
const dateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

export function formatDate(iso: string | null): string {
  return iso ? dateOnly.format(new Date(iso)) : ''
}

export function formatDateTime(iso: string | null): string {
  return iso ? dateTime.format(new Date(iso)) : ''
}

export function languageName(code: string): string {
  return code === 'es' ? 'Spanish' : 'English'
}