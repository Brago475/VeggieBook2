import { Fragment } from 'react'

// Shows text from the original data with its bold kept.
//
// The Secrets' "Why It Works" text marks bold with <b>...</b> (the moms'
// quotes and their names). The original app put that text straight into
// the page as HTML. This does not: <b> is the only tag in the data, so it
// is turned into <strong> here and everything else is shown as plain text,
// which React escapes. Nothing from the database is ever run as HTML.
//
// Line breaks are kept by the CSS (white-space: pre-line) on the element
// that holds this, matching the original's line breaks.

type Props = {
  text: string | null | undefined
}

export function RichText({ text }: Props) {
  if (!text) return null

  // Splitting on the tags leaves bold and plain pieces alternating:
  // "a <b>b</b> c" becomes ["a ", "b", " c"], so every odd piece is bold.
  const parts = text.split(/<\/?b>/i)

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i}>{part}</strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}