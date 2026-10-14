import { useState, type CSSProperties } from 'react'

// The full-screen loading state: the VeggieBook logo on white, the word
// LOADING, and a row of vegetables that fill in with color from left to
// right while a green bar grows under them.
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
  // Fades the screen out (see hooks/useSplash.ts).
  leaving?: boolean
}

export function LoadingScreen({ leaving = false }: Props) {
  // Starts the animation partway through so it continues from the static
  // screen without jumping back to an empty bar.
  const [offset] = useState(() => Math.round(performance.now() % CYCLE_MS))
  const style = { '--loading-offset': `-${offset}ms` } as CSSProperties

  const icons = VEGGIES.map((v) => (
    <img key={v} src={`/icons/veg/${v}.svg`} alt="" />
  ))

  return (
    <div
      className={leaving ? 'loading-screen is-leaving' : 'loading-screen'}
      role="status"
      aria-label="Loading VeggieBook"
      aria-hidden={leaving || undefined}
      style={style}
    >
      <img className="loading-logo" src="/brand/logo-positive-en.png" alt="" />
      <p className="loading-label" aria-hidden="true">
        Loading...
      </p>
      <div className="loading-progress" aria-hidden="true">
        <div className="loading-veg">
          <div className="loading-veg-row loading-veg-base">{icons}</div>
          <div className="loading-veg-row loading-veg-lit">{icons}</div>
        </div>
        <div className="loading-track">
          <div className="loading-track-fill" />
        </div>
      </div>
    </div>
  )
}