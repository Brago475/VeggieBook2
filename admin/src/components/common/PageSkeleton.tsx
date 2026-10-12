import '../../styles/skeleton.css'

// Loading state for admin pages, matching the main app's loader
// (web/src/components/layout/LoadingScreen.tsx): the logo, a row of
// vegetables that fill with color, and a green progress bar.
// Icons: Microsoft Fluent Emoji, MIT license (public/icons/veg/LICENSE.txt).

const VEGGIES = ['carrot', 'broccoli', 'tomato', 'leafy-green', 'corn', 'cucumber', 'potato', 'onion']

type Props = {
  /** Accepted for existing call sites; the loader has no card row. */
  cards?: number
  label?: string
}

export function PageSkeleton({ label = 'Loading' }: Props) {
  const icons = VEGGIES.map((v) => <img key={v} src={`/icons/veg/${v}.svg`} alt="" />)

  return (
    <div className="vl-page" role="status" aria-live="polite" aria-label={label}>
      <img className="vl-logo" src="/brand/logo-positive-en.png" alt="" />
      <p className="vl-label" aria-hidden="true">
        Loading...
      </p>
      <div className="vl-progress" aria-hidden="true">
        <div className="vl-veg">
          <div className="vl-row vl-base">{icons}</div>
          <div className="vl-row vl-lit">{icons}</div>
        </div>
        <div className="vl-track">
          <div className="vl-fill" />
        </div>
      </div>
    </div>
  )
}