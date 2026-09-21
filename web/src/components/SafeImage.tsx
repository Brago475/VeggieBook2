import { useState } from 'react'

// An image that degrades instead of breaking.
//
// Three sources, tried in order:
//
//   src         the photo we want
//   the logo    from /brand, the same path convention Masthead uses
//   the drawing inline SVG, below
//
// The first two are fetched files and can fail. The drawing cannot, because
// it is never requested. Without a guaranteed end, a typo in the brand path
// gives a broken-image icon, which is the thing this component exists to
// prevent.
//
// The mark rather than a stand-in photograph: a dimmed vegetable photo reads
// as a bad photo, while the logo reads as "no photo here."
//
// fallbackSrc is still available for callers that have a better second guess
// than the logo, but nothing passes it today.
//
// Empty or null sources are dropped from the chain rather than attempted,
// since an empty src makes the browser request the page itself.
//
// onError advances one step and warns once, naming the path, so a broken
// image shows up in DevTools without the user being shown anything.

const DRAWING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="#8cc63e"/>
  <circle cx="60" cy="64" r="29" fill="none" stroke="#fff" stroke-width="4" opacity="0.85"/>
  <circle cx="60" cy="64" r="17" fill="none" stroke="#fff" stroke-width="3" opacity="0.55"/>
  <path d="M60 47c0-9 6-15 14-17-1 9-6 15-14 17z" fill="#fff" opacity="0.85"/>
</svg>`

const DRAWING =
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(DRAWING_SVG)

type Props = {
  src?: string | null
  /** An optional second guess, tried before the logo. Unused today. */
  fallbackSrc?: string | null
  /** Which logo to fall back to. Matches Masthead's default. */
  lang?: 'en' | 'es'
  alt?: string
  className?: string
  loading?: 'lazy' | 'eager'
}

// How far down the chain this image has fallen, and for which chain. A
// failure only counts for the chain it happened on.
type Fallback = {
  chainKey: string
  step: number
}

export function SafeImage({
  src,
  fallbackSrc,
  lang = 'en',
  alt = '',
  className,
  loading = 'lazy',
}: Props) {
  const logo = `/brand/logo-negative-${lang}.png`

  const chain = [src, fallbackSrc]
    .filter((s): s is string => Boolean(s))
    .concat(logo, DRAWING)

  const chainKey = chain.join('|')

  const [fallback, setFallback] = useState<Fallback>({ chainKey, step: 0 })

  // A new source is a fresh chance. Read in the same render rather than
  // reset by an effect, which ran one frame late: the new photo's first
  // frame showed the placeholder left over from the previous one.
  const step = fallback.chainKey === chainKey ? fallback.step : 0

  const index = Math.min(step, chain.length - 1)
  const atEnd = index >= chain.length - 1
  const current = chain[index]

  // The last two are marks, not photographs, so they are contained on the
  // brand green rather than cropped to fill.
  const onPlaceholder = current === logo || current === DRAWING

  const classes = [className, onPlaceholder ? 'is-placeholder' : null]
    .filter(Boolean)
    .join(' ')

  return (
    <img
      className={classes || undefined}
      src={current}
      alt={alt}
      loading={loading}
      onError={() => {
        if (atEnd) return
        console.warn('SafeImage: could not load', chain[index])
        setFallback({ chainKey, step: index + 1 })
      }}
    />
  )
}