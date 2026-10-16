import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { SPLASH_FINISH_MS } from '../../hooks/useSplash'
import { useLang } from '../../i18n/languageContext'
import { COMMON } from '../../i18n/strings/common'
import { useStrings } from '../../i18n/useStrings'

// The full-screen loading state: the VeggieBook logo on white, the word
// LOADING, and a row of vegetables that fill in with color from left to
// right while a green bar grows under them. The logo and word follow the
// site language.
//
// When leaving, the bar sweeps from its current point to full, then the
// screen fades (timings in hooks/useSplash.ts).
//
// The same screen is written directly into web/index.html, where it shows
// before any JavaScript has loaded. Both use the class names styled in
// index.html. Keep this markup, and the order of VEGGIES, matching there.
//
// The icons are Microsoft Fluent Emoji, MIT license, kept with the files
// in public/icons/veg/LICENSE.txt.

const VEGGIES = [
  'carrot',
  'broccoli',
  'tomato',
  'leafy-green',
  'corn',
  'cucumber',
  'potato',
  'onion',
]

// Must match the 2.6s animation length in index.html.
const CYCLE_MS = 2600

type Props = {
  // Finishes the bar and fades the screen out (see hooks/useSplash.ts).
  leaving?: boolean
}

// Stops the looping animation where it is and eases the element to full.
function sweepToFull(el: HTMLElement, prop: 'clipPath' | 'transform', full: string) {
  const current = getComputedStyle(el)[prop]
  el.style.animation = 'none'
  el.style[prop] = current
  void el.offsetWidth
  const cssProp = prop === 'clipPath' ? 'clip-path' : 'transform'
  el.style.transition = `${cssProp} ${SPLASH_FINISH_MS}ms ease-out`
  el.style[prop] = full
}

export function LoadingScreen({ leaving = false }: Props) {
  const { lang } = useLang()
  const t = useStrings(COMMON)
  const litRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const [fading, setFading] = useState(false)

  // Starts the animation partway through so it continues from the static
  // screen without jumping back to an empty bar.
  const [offset] = useState(() => Math.round(performance.now() % CYCLE_MS))
  const style = { '--loading-offset': `-${offset}ms` } as CSSProperties

  useLayoutEffect(() => {
    if (!leaving) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduce && litRef.current && fillRef.current) {
      sweepToFull(litRef.current, 'clipPath', 'inset(0 0 0 0)')
      sweepToFull(fillRef.current, 'transform', 'scaleX(1)')
    }
    const timer = window.setTimeout(() => setFading(true), reduce ? 0 : SPLASH_FINISH_MS)
    return () => window.clearTimeout(timer)
  }, [leaving])

  const icons = VEGGIES.map((v) => (
    <img key={v} src={`/icons/veg/${v}.svg`} alt="" />
  ))

  return (
    <div
      className={fading ? 'loading-screen is-leaving' : 'loading-screen'}
      role="status"
      aria-label={t.loadingLabel}
      aria-hidden={leaving || undefined}
      style={style}
    >
      <img className="loading-logo" src={`/brand/logo-positive-${lang}.png`} alt="" />
      <p className="loading-label" aria-hidden="true">
        {t.loading}
      </p>
      <div className="loading-progress" aria-hidden="true">
        <div className="loading-veg">
          <div className="loading-veg-row loading-veg-base">{icons}</div>
          <div ref={litRef} className="loading-veg-row loading-veg-lit">
            {icons}
          </div>
        </div>
        <div className="loading-track">
          <div ref={fillRef} className="loading-track-fill" />
        </div>
      </div>
    </div>
  )
}