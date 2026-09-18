import { useEffect, useState } from 'react'

// An image that degrades instead of breaking.
//
// Four sources, tried in order:
//
//   src           the photo we want
//   fallbackSrc   optional, usually the vegetable's own cover
//   the logo      from /brand, the same path convention Masthead uses
//   the drawing   inline SVG, below
//
// The first three are fetched files and can in principle fail. The drawing
// cannot, because it is never requested. That is why it stays: without a
// guaranteed end, a typo in the brand path gives a broken-image icon, which
// is the exact thing this component exists to prevent.
//
// The positive logo rather than the negative one: negative is a light mark
// for dark surfaces, which is right for the masthead and wrong for a
// thumbnail on a white card. Positive sits on a light neutral and recedes.
//
// Empty or null sources are dropped from the chain rather than attempted,
// since an empty src makes the browser request the page itself.
//
// onError advances one step. Once the last source is showing, onError is
// ignored, otherwise a browser that fires it repeatedly would spin.

const DRAWING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="#f6f6f2"/>
  <circle cx="60" cy="64" r="29" fill="none" stroke="#d5d5cc" stroke-width="4"/>
  <circle cx="60" cy="64" r="17" fill="none" stroke="#e6e6df" stroke-width="3"/>
  <path d="M60 47c0-9 6-15 14-17-1 9-6 15-14 17z" fill="#d5d5cc"/>
  <path d="M60 47c-1-6-4-10-9-12" fill="none" stroke="#d5d5cc"
        stroke-width="3" stroke-linecap="round"/>
</svg>`

const DRAWING =
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(DRAWING_SVG)

type Props = {
  src?: string | null
  /** Tried when src fails. Usually the vegetable's own cover. */
  fallbackSrc?: string | null
  /** Added to className once anything past the first source is showing. */
  fallbackClassName?: string
  /** Which logo to fall back to. Matches Masthead's default. */
  lang?: 'en' | 'es'
  alt?: string
  className?: string
  loading?: 'lazy' | 'eager'
}

export function SafeImage({
  src,
  fallbackSrc,
  fallbackClassName,
  lang = 'en',
  alt = '',
  className,
  loading = 'lazy',
}: Props) {
  const logo = `/brand/logo-positive-${lang}.png`

  const chain = [src, fallbackSrc]
    .filter((s): s is string => Boolean(s))
    .concat(logo, DRAWING)

  const [step, setStep] = useState(0)

  // A new source is a fresh chance, so start over rather than staying on
  // the placeholder left from whatever was rendered here before.
  useEffect(() => {
    setStep(0)
  }, [src, fallbackSrc, logo])

  const index = Math.min(step, chain.length - 1)
  const atEnd = index >= chain.length - 1
  const current = chain[index]

  // The last two are marks, not photographs, so they are contained on a
  // neutral rather than cropped to fill, and never dimmed.
  const onPlaceholder = current === logo || current === DRAWING

  const classes = [
    className,
    step > 0 && !onPlaceholder ? fallbackClassName : null,
    onPlaceholder ? 'is-placeholder' : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <img
      className={classes || undefined}
      src={current}
      alt={alt}
      loading={loading}
      onError={() => {
        if (!atEnd) setStep((s) => s + 1)
      }}
    />
  )
}