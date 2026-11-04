// Returns the address only when it is a normal web link (http or https),
// otherwise null. Used for links that come from content, such as Secret links.

export function safeWebUrl(value: string | null | undefined): string | null {
  const text = value?.trim()
  if (!text) return null
  try {
    const url = new URL(text)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}