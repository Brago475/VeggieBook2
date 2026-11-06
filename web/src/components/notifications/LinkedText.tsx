import { Fragment } from 'react'

// Message text with web addresses turned into links. Links open in a new
// tab. Trailing punctuation stays outside the link.

const URL_PATTERN = /(https?:\/\/[^\s<>"']+)/g
const TRAILING = /[.,!?;:)\]]+$/

type Props = {
  text: string
  // Hidden text read after each link, such as "opens in a new tab".
  linkNote: string
  onLink?: () => void
}

export function LinkedText({ text, linkNote, onLink }: Props) {
  // With a capture group, split puts each address at an odd index.
  const parts = text.split(URL_PATTERN)

  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>

        const trail = part.match(TRAILING)?.[0] ?? ''
        const href = trail ? part.slice(0, -trail.length) : part

        return (
          <Fragment key={i}>
            <a
              className="nf-link"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onLink}
            >
              {href}
              <span className="visually-hidden"> ({linkNote})</span>
            </a>
            {trail}
          </Fragment>
        )
      })}
    </>
  )
}