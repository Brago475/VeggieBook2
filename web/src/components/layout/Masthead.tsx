import { useLang } from '../../i18n/languageContext'
import { COMMON } from '../../i18n/strings/common'
import { useStrings } from '../../i18n/useStrings'
import { LeafDecor } from './LeafDecor'

// Green brand bar. Appears on every screen except Welcome and the account
// forms. Holds only the Back button and the logo.
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
// Book. Both follow the site language (files in public/brand/, one per
// language).

type Props = {
  brand?: 'veggie' | 'secrets'
  onBack?: () => void
  decor?: boolean
}

export function Masthead({ brand = 'veggie', onBack, decor = false }: Props) {
  const { lang } = useLang()
  const t = useStrings(COMMON)

  const logo =
    brand === 'secrets'
      ? { src: `/brand/SecretsBook_logo_reversed_${lang}.png`, alt: t.secretsLogoAlt }
      : { src: `/brand/logo-negative-${lang}.png`, alt: t.veggieLogoAlt }

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
          <span className="masthead-back-label">{t.back}</span>
        </button>
      )}

      <img className="masthead-logo" src={logo.src} alt={logo.alt} />
    </header>
  )
}