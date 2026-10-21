import { useState } from 'react'
import { useLang } from '../../i18n/languageContext'
import { AUTO_SIZES, isSizable, sizedSrcSet, useImageManifest } from '../../utils/imageSizes'

// An image that degrades instead of breaking.
//
// Sources, tried in order:
//
//   sized copies  smaller WebP copies of src, when the manifest lists them
//   src           the original photo
//   fallbackSrc   an optional second guess, unused today
//   the logo      from /brand, in the site language, as Masthead uses
//   the drawing   inline SVG, below
//
// The drawing is never requested, so it cannot fail. Without a guaranteed
// end, a typo in the brand path gives a broken-image icon, which is the
// thing this component exists to prevent.
//
// The mark rather than a stand-in photograph: a dimmed vegetable photo reads
// as a bad photo, while the logo reads as "no photo here."
//
// Empty or null sources are dropped from the chain rather than attempted,
// since an empty src makes the browser request the page itself.
//
// /images photos wait for the copy manifest before loading, so the original
// is not downloaded first and then replaced by a copy.

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
  /** Which logo to fall back to. Defaults to the site language. */
  lang?: 'en' | 'es'
  alt?: string
  className?: string
  loading?: 'lazy' | 'eager'
}

type Source = {
  src: string
  srcSet?: string
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
  lang,
  alt = '',
  className,
  loading = 'lazy',
}: Props) {
  const { lang: siteLang } = useLang()
  const manifest = useImageManifest()
  const logo = `/brand/logo-negative-${lang ?? siteLang}.png`

  const waiting = manifest === null && isSizable(src)
  const srcSet = src ? sizedSrcSet(src, manifest) : undefined

  const chain: Source[] = []
  if (src && srcSet) chain.push({ src, srcSet })
  for (const s of [src, fallbackSrc]) {
    if (s) chain.push({ src: s })
  }
  chain.push({ src: logo }, { src: DRAWING })

  const chainKey = chain.map((s) => s.srcSet ?? s.src).join('|')

  const [fallback, setFallback] = useState<Fallback>({ chainKey, step: 0 })

  // A new source is a fresh chance. Read in the same render rather than
  // reset by an effect, which ran one frame late: the new photo's first
  // frame showed the placeholder left over from the previous one.
  const step = fallback.chainKey === chainKey ? fallback.step : 0

  const index = Math.min(step, chain.length - 1)
  const atEnd = index >= chain.length - 1
  const current = chain[index]

  if (waiting) {
    return <img className={className} alt={alt} loading={loading} />
  }

  // The last two are marks, not photographs, so they are contained on the
  // brand green rather than cropped to fill.
  const onPlaceholder = current.src === logo || current.src === DRAWING

  const classes = [className, onPlaceholder ? 'is-placeholder' : null]
    .filter(Boolean)
    .join(' ')

  return (
    <img
      key={current.srcSet ? 'sized' : 'plain'}
      className={classes || undefined}
      alt={alt}
      loading={loading}
      sizes={current.srcSet ? AUTO_SIZES : undefined}
      srcSet={current.srcSet}
      src={current.src}
      onError={() => {
        if (atEnd) return
        console.warn('SafeImage: could not load', current.srcSet ?? current.src)
        setFallback({ chainKey, step: index + 1 })
      }}
    />
  )
}