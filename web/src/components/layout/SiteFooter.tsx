import { useId, useState } from 'react'
import { FOOTER } from '../../i18n/strings/footer'
import { useStrings } from '../../i18n/useStrings'
import { ChevronRightIcon } from '../icons/LibraryIcons'

// Footer for the main screens: Welcome, home, a saved book, account, About,
// and the Terms and Privacy pages. Styled as a small closed book: a green
// spine with the name, then the title and short line, the loading screen's
// vegetables in the corner, the credit folded to one line with Read more,
// and a row with the About link and the legal links. The same layout is
// used on every screen size.
//
// Hidden while a book is being made and on the sign in and create account
// forms (see App.tsx), so it never sits under the NEXT and KEEP buttons or
// pulls attention from a form.
//
// Each link is left out on its own page, so the card never links to the
// page it is already on.
//
// Vegetable icons: Microsoft Fluent Emoji, MIT license (public/icons/veg).

type Props = {
  onAbout?: () => void
  onTerms?: () => void
  onPrivacy?: () => void
}

const VEGGIES = ['carrot', 'broccoli', 'tomato', 'leafy-green']

export function SiteFooter({ onAbout, onTerms, onPrivacy }: Props) {
  const t = useStrings(FOOTER)
  const [open, setOpen] = useState(false)
  const creditId = useId()
  const hasLegal = Boolean(onTerms || onPrivacy)

  return (
    <footer className="site-footer">
      <div className="site-footer-card">
        <div className="site-footer-spine" aria-hidden="true">
          <span>
            <span className="site-footer-spine-veggie">Veggie</span>
            <span className="site-footer-spine-book">Book</span>
          </span>
        </div>

        <div className="site-footer-body">
          <div className="site-footer-head">
            <div className="site-footer-head-text">
              <h2 className="site-footer-title">{t.title}</h2>
              <p className="site-footer-sub">
                {t.subBefore}
                <strong>{t.subStrong}</strong>
                {t.subAfter}
              </p>
            </div>

            <div className="site-footer-veg" aria-hidden="true">
              {VEGGIES.map((v) => (
                <span key={v} className="site-footer-veg-chip">
                  <img src={`/icons/veg/${v}.svg`} alt="" />
                </span>
              ))}
            </div>
          </div>

          <div className={open ? 'site-footer-credit-row is-open' : 'site-footer-credit-row'}>
            <p id={creditId} className="site-footer-credit">
              {t.credit}
            </p>
            <button
              type="button"
              className="site-footer-more"
              aria-expanded={open}
              aria-controls={creditId}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? t.showLess : t.readMore}
              <ChevronRightIcon className="site-footer-more-icon" />
            </button>
          </div>

          {(onAbout || hasLegal) && (
            <div className="site-footer-foot">
              {onAbout && (
                <button type="button" className="site-footer-btn" onClick={onAbout}>
                  {t.learnMore}
                  <ChevronRightIcon className="site-footer-chevron" />
                </button>
              )}

              {hasLegal && (
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
          )}
        </div>
      </div>
    </footer>
  )
}