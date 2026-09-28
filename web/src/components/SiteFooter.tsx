import { BookSproutIcon } from './FooterIcons'
import { LeafDecor } from './LeafDecor'
import { ChevronRightIcon } from './LibraryIcons'

// Footer for the main screens: Welcome, home, a saved book, account, and
// About. One soft green card: an icon and title, a short line on where the
// app comes from, the credit to the original creators and funder and to
// Kean, and a button to the About page with the full story.
//
// Hidden while a book is being made and on the sign in and create account
// forms (see App.tsx), so it never sits under the NEXT and KEEP buttons or
// pulls attention from a form.
//
// onAbout is left out on the About screen itself, so the card does not
// link to the page it is already on.

type Props = {
  onAbout?: () => void
}

export function SiteFooter({ onAbout }: Props) {
  return (
    <footer className="site-footer">
      <div className="site-footer-card">
        <LeafDecor className="site-footer-leaf" />

        <div className="site-footer-head">
          <span className="site-footer-icon">
            <BookSproutIcon />
          </span>
          <div className="site-footer-head-text">
            <h2 className="site-footer-title">About VeggieBook</h2>
            <p className="site-footer-sub">
              Built from <strong>years of</strong> nutrition research and community
              work.
            </p>
          </div>
        </div>

        <p className="site-footer-credit">
          Originally created by Dr. Peter Clarke and Dr. Susan H. Evans at the USC
          Annenberg School for Communication and Journalism, with support from the
          U.S. Department of Agriculture. Continued and rebuilt at Kean University.
        </p>

        {onAbout && (
          <button type="button" className="site-footer-btn" onClick={onAbout}>
            Learn about the project
            <ChevronRightIcon className="site-footer-chevron" />
          </button>
        )}
      </div>
    </footer>
  )
}