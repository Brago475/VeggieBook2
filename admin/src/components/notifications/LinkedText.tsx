// Shows message text with https:// addresses as links, the same way the
// main site shows them. Trailing punctuation stays outside the link.

type Part = { text: string; href?: string }

export function splitLinks(text: string): Part[] {
  const parts: Part[] = []
  const re = /https:\/\/\S+/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(text))) {
    const trail = match[0].match(/[.,!?;:)]+$/)?.[0] ?? ''
    const url = match[0].slice(0, match[0].length - trail.length)
    if (match.index > last) parts.push({ text: text.slice(last, match.index) })
    parts.push({ text: url, href: url })
    last = match.index + url.length
  }
  if (last < text.length) parts.push({ text: text.slice(last) })
  return parts
}

export function LinkedText({ text }: { text: string }) {
  return (
    <>
      {splitLinks(text).map((part, i) =>
        part.href ? (
          <a key={i} href={part.href} target="_blank" rel="noreferrer">
            {part.text}
          </a>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  )
}