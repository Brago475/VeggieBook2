import { NavBar } from '../components/layout/NavBar'
import { FLOW } from '../i18n/strings/flow'
import { SECRETS } from '../i18n/strings/secrets'
import { useStrings } from '../i18n/useStrings'

// Sits between choosing a category and the first secret, as in the
// original app: "We are getting Breakfast Secrets. You can review each
// Secret and KEEP or DROP it." The Secrets counterpart of Transition, with
// the same layout and classes, and the same drawn arrow pointing at NEXT.
// The sentences use the same button words as the secret review screen.
//
// A separate file so the VeggieBook transition stays exactly as it is.
//
// categoryName is the category's full name ("Breakfast Secrets"), as the
// API sends it in the site language.

type Props = {
  categoryName: string
  onNext: () => void
}

export function SecretTransition({ categoryName, onNext }: Props) {
  const flow = useStrings(FLOW)
  const t = useStrings(SECRETS)

  return (
    <>
      <div className="transition">
        <p className="transition-line">{t.gettingCategory(categoryName)}</p>
        <p className="transition-line">{t.reviewEach(t.keep, t.drop)}</p>

        <p className="transition-cue">{flow.pressNext(flow.next)}</p>
        <div className="transition-arrow" aria-hidden="true" />
      </div>

      <NavBar primaryLabel={flow.next} onPrimary={onNext} />
    </>
  )
}