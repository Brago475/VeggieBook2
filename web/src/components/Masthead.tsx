import { LeafDecor } from './LeafDecor'

// Green brand bar. Appears on every screen.
//
// The original app used a bare chevron here, which works on a phone where
// that gesture is conventional. On the web it reads as decoration, so the
// arrow is paired with the word "Back" inside a pill.
//
// decor adds a faint leaf in the right corner. Off by default so busy
// screens like the library stay clean; the account screen turns it on.
//
// The negative logo is the version built for a colored background. Files
// live in public/brand/ and are referenced by absolute path rather than
// imported, so switching to the Spanish logo later is a string change.

type Props = {
  lang?: 'en' | 'es'
  onBack?: () => void
  decor?: boolean
}

export function Masthead({ lang = 'en', onBack, decor = false }: Props) {
  return (
    <header className="masthead">
      {decor && <LeafDecor className="masthead-decor" />}

      {onBack && (
        <button type="button" className="masthead-back" onClick={onBack}>
          <svg
            className="masthead-back-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M15 5l-7 7 7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="masthead-back-label">Back</span>
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