import { FOOTER } from '../../i18n/strings/footer'
import { useStrings } from '../../i18n/useStrings'
import { BookSproutIcon } from '../icons/FooterIcons'
import { LeafDecor } from '../layout/LeafDecor'
import { ChevronRightIcon } from '../icons/LibraryIcons'

// Footer for the main screens: Welcome, home, a saved book, account, About,
// and the Terms and Privacy pages. One soft green card: an icon and title, a
// short line on where the app comes from, the credit to the original
// creators and funder and to Kean, a button to the About page with the full
// story, and links to the Terms of Use and Privacy Policy.
//
// Hidden while a book is being made and on the sign in and create account
// forms (see App.tsx), so it never sits under the NEXT and KEEP buttons or
// pulls attention from a form.
//
// Each link is left out on its own page, so the card never links to the
// page it is already on.

type Props = {
  onAbout?: () => void
  onTerms?: () => void
  onPrivacy?: () => void
}

export function SiteFooter({ onAbout, onTerms, onPrivacy }: Props) {
  const t = useStrings(FOOTER)

  return (
    <footer className="site-footer">
      <div className="site-footer-card">
        <LeafDecor className="site-footer-leaf" />

        <div className="site-footer-head">
          <span className="site-footer-icon">
            <BookSproutIcon />
          </span>
          <div className="site-footer-head-text">
            <h2 className="site-footer-title">{t.title}</h2>
            <p className="site-footer-sub">
              {t.subBefore}
              <strong>{t.subStrong}</strong>
              {t.subAfter}
            </p>
          </div>
        </div>

        <p className="site-footer-credit">{t.credit}</p>

        {onAbout && (
          <button type="button" className="site-footer-btn" onClick={onAbout}>
            {t.learnMore}
            <ChevronRightIcon className="site-footer-chevron" />
          </button>
        )}

        {(onTerms || onPrivacy) && (
          <nav className="site-footer-links" aria-label={t.legal}>
            {onTerms && (
              <button type="button" className="site-footer-link" onClick={onTerms}>
                {t.terms}
              </button>
            )}
            {onTerms && onPrivacy && (
              <span className="site-footer-dot" aria-hidden="true">
                |
              </span>
            )}
            {onPrivacy && (
              <button type="button" className="site-footer-link" onClick={onPrivacy}>
                {t.privacy}
              </button>
            )}
          </nav>
        )}
      </div>
    </footer>
  )
}