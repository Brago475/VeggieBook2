// The first web address in a message, for its link card.

const LINK_PATTERN = /https?:\/\/[^\s<>"']+/
const TRAILING = /[.,!?;:)\]]+$/

export function firstLink(text: string): string | null {
  const match = text.match(LINK_PATTERN)
  return match ? match[0].replace(TRAILING, '') : null
}

export function hostOf(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, '')
  } catch {
    return href
  }
}