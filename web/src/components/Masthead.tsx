// Green brand bar. Appears on every screen.
//
// The original app used a bare chevron here, which works on a phone where
// that gesture is conventional. On the web it reads as decoration, so the
// arrow is paired with the word "Back".
//
// The negative logo is the version built for a colored background. Files
// live in public/brand/ and are referenced by absolute path rather than
// imported, so switching to the Spanish logo later is a string change.

type Props = {
  lang?: 'en' | 'es'
  onBack?: () => void
}

export function Masthead({ lang = 'en', onBack }: Props) {
  return (
    <header className="masthead">
      {onBack && (
        <button type="button" className="masthead-back" onClick={onBack}>
          <span aria-hidden="true">&#8249;</span> Back
        </button>
      )}
      <img
        className="masthead-logo"
        src={`/brand/logo-negative-${lang}.png`}
        alt="VeggieBook, Quick Help for Meals"
      />
    </header>
  )
}