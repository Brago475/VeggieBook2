import { NavBar } from '../components/layout/NavBar'
import { FLOW } from '../i18n/strings/flow'
import { useStrings } from '../i18n/useStrings'

// Sits between the last question and the recipe review, explaining what
// KEEP and DROP mean before the user meets those buttons. The original app
// used a large down arrow pointing at the button; the arrow is drawn in CSS
// rather than shipped as an image. The sentences use the same button words
// as the review screen, in the site language.

type Props = {
  onNext: () => void
}

export function Transition({ onNext }: Props) {
  const t = useStrings(FLOW)

  return (
    <>
      <div className="transition">
        <p className="transition-line">{t.gettingRecipes}</p>
        <p className="transition-line">{t.reviewEach(t.keep, t.drop)}</p>

        <p className="transition-cue">{t.pressNext(t.next)}</p>
        <div className="transition-arrow" aria-hidden="true" />
      </div>

      <NavBar primaryLabel={t.next} onPrimary={onNext} />
    </>
  )
}