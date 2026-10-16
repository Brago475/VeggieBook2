import { useState, type CSSProperties } from 'react'

// First-load screen. Same markup and class names as the static screen in
// admin/index.html, which styles it. Keep VEGGIES in the same order.
// Icons: Microsoft Fluent Emoji, MIT license (public/icons/veg/LICENSE.txt).

const VEGGIES = ['carrot', 'broccoli', 'tomato', 'leafy-green', 'corn', 'cucumber', 'potato', 'onion']

// Must match the 2.6s animation length in index.html.
const CYCLE_MS = 2600

type Props = {
  // Fades the screen out (see hooks/useSplash.ts).
  leaving?: boolean
}

export function LoadingScreen({ leaving = false }: Props) {
  // Continues the static screen's animation instead of restarting it.
  const [offset] = useState(() => Math.round(performance.now() % CYCLE_MS))
  const style = { '--loading-offset': `-${offset}ms` } as CSSProperties

  const icons = VEGGIES.map((v) => <img key={v} src={`/icons/veg/${v}.svg`} alt="" />)

  return (
    <div
      className={leaving ? 'loading-screen is-leaving' : 'loading-screen'}
      role="status"
      aria-label="Loading VeggieBook admin"
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