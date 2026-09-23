import { ArrowIcon, LeafIcon } from '../components/AuthIcons'
import { LeafDecor } from '../components/LeafDecor'
import { SafeImage } from '../components/SafeImage'
import { BowlIcon, OpenBookIcon, SproutIcon } from '../components/StepIcons'
import { AUTH_PHOTO } from '../utils/authPhoto'
import { coverSrc } from '../utils/coverSrc'

// First screen for a visitor who is not signed in.
//
// Three ways in. An account keeps books on the server, so they are there on
// any device. A guest can use the whole site, but nothing is saved anywhere,
// not on the server and not in the browser. A guest can still create an
// account when their book is finished, and that book is saved into it.
//
// Below the three ways in, a card with three short steps says what the site
// does, for a visitor who has never seen it before. On a tall window the
// guest option and the card move down a little (see .auth-lower in
// auth.css), with room left at the bottom for a footer later.
//
// The masthead is hidden on this screen (see App.tsx), so the photograph
// takes the top of the screen and the logo sits under it, between two faint
// leaves.

type Props = {
  onCreateAccount: () => void
  onSignIn: () => void
  onGuest: () => void
}

const STEPS = [
  { label: 'Pick what you have', Icon: SproutIcon },
  { label: 'Discover recipes', Icon: BowlIcon },
  { label: 'Build your book', Icon: OpenBookIcon },
]

export function Welcome({ onCreateAccount, onSignIn, onGuest }: Props) {
  return (
    <div className="auth-screen">
      {/* eager, not lazy: this is the first thing on the first screen, and
          waiting for it to scroll into view means it is never ready. */}
      <div className="auth-hero">
        <SafeImage src={coverSrc(AUTH_PHOTO)} loading="eager" />
      </div>

      <div className="auth-main">
        <LeafDecor className="auth-leaf is-left" />
        <LeafDecor className="auth-leaf is-right" />

        <img
          className="auth-logo"
          src="/brand/logo-positive-en.png"
          alt="VeggieBook, Quick Help for Meals"
        />

        <div className="auth-head">
          <p className="auth-sub">
            Make your own recipe book for the vegetable you already have.
          </p>
        </div>

        <div className="auth-fields">
          <button type="button" className="auth-primary" onClick={onCreateAccount}>
            Create account
            <ArrowIcon />
          </button>
          <button type="button" className="auth-secondary" onClick={onSignIn}>
            Sign in
          </button>
        </div>

        <div className="auth-lower">
          <div className="auth-or">or</div>

          <div className="auth-fields">
            <button type="button" className="auth-guest" onClick={onGuest}>
              <LeafIcon />
              Continue as guest
            </button>
            <p className="auth-note">As a guest, your books are not saved.</p>
          </div>

          <section className="auth-steps" aria-labelledby="how-it-works">
            <h2 id="how-it-works" className="auth-steps-title">
              How VeggieBook works
            </h2>
            <ol className="auth-steps-list">
              {STEPS.map(({ label, Icon }) => (
                <li key={label} className="auth-step">
                  <span className="auth-step-icon">
                    <Icon />
                  </span>
                  <span className="auth-step-label">{label}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  )
}