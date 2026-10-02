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
// brand picks the logo, as the original app did: the VeggieBook logo
// everywhere, and the SecretsBook logo while making or reading a Secrets
// Book. The SecretsBook file is the large one from the original assets
// (SecretsBook_logo_reversed), since the small one the original header used
// is too few pixels to stay sharp on a modern screen.
//
// Both are the versions built for a colored background. Files live in
// public/brand/ and are referenced by absolute path rather than imported,
// so switching to the Spanish logo later is a string change.

type Props = {
  lang?: 'en' | 'es'
  brand?: 'veggie' | 'secrets'
  onBack?: () => void
  decor?: boolean
}

export function Masthead({ lang = 'en', brand = 'veggie', onBack, decor = false }: Props) {
  const logo =
    brand === 'secrets'
      ? {
          src: `/brand/SecretsBook_logo_reversed_${lang}.png`,
          alt: 'SecretsBook, Quick Help for Meals',
        }
      : {
          src: `/brand/logo-negative-${lang}.png`,
          alt: 'VeggieBook, Quick Help for Meals',
        }

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

      <img className="masthead-logo" src={logo.src} alt={logo.alt} />
    </header>
  )
}