import { NavBar } from '../components/NavBar'

// Sits between the last question and the recipe review, explaining what
// KEEP and DROP mean before the user meets those buttons. The original app
// used a large down arrow pointing at the button; the arrow is drawn in CSS
// rather than shipped as an image.

type Props = {
  onNext: () => void
}

export function Transition({ onNext }: Props) {
  return (
    <>
      <div className="transition">
        <p className="transition-line">We are getting your recipes.</p>
        <p className="transition-line">
          You can review each recipe and KEEP or DROP it.
        </p>

        <p className="transition-cue">Press NEXT below to continue</p>
        <div className="transition-arrow" aria-hidden="true" />
      </div>

      <NavBar primaryLabel="NEXT" onPrimary={onNext} />
    </>
  )
}