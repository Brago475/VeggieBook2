import { NavBar } from '../components/NavBar'

// Sits between choosing a category and the first secret, as in the
// original app: "We are getting Breakfast Secrets. You can review each
// Secret and KEEP or DROP it." The Secrets counterpart of Transition, with
// the same layout and classes, and the same drawn arrow pointing at NEXT.
//
// A separate file so the VeggieBook transition stays exactly as it is.
//
// categoryName is the category's full name ("Breakfast Secrets"), as the
// API sends it.

type Props = {
  categoryName: string
  onNext: () => void
}

export function SecretTransition({ categoryName, onNext }: Props) {
  return (
    <>
      <div className="transition">
        <p className="transition-line">We are getting {categoryName}.</p>
        <p className="transition-line">
          You can review each Secret and KEEP or DROP it.
        </p>

        <p className="transition-cue">Press NEXT below to continue</p>
        <div className="transition-arrow" aria-hidden="true" />
      </div>

      <NavBar primaryLabel="NEXT" onPrimary={onNext} />
    </>
  )
}