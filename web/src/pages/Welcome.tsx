import { useState } from 'react'
import { ArrowIcon, LeafIcon } from '../components/AuthIcons'
import { LeafDecor } from '../components/LeafDecor'
import { SafeImage } from '../components/SafeImage'
import { BowlIcon, OpenBookIcon, SproutIcon } from '../components/StepIcons'
import { AUTH_PHOTO } from '../utils/authPhoto'
import { coverSrc } from '../utils/coverSrc'

// First screen for a visitor who is not signed in.
//
// Three ways in. An account keeps books on the server, so they are there on
// any device. A guest gets a temporary account: books save and open like an
// account's, and everything is deleted when the guest signs out, or 24 hours
// after they started. A guest can create an account later and keep their
// books.
//
// Below the three ways in, a card with three short steps says what the site
// does, for a visitor who has never seen it before. On a tall window the
// guest option and the card move down a little (see .auth-lower in
// auth.css).
//
// The masthead is hidden on this screen (see App.tsx), so the photograph
// takes the top of the screen and the logo sits under it, between two faint
// leaves.

type Props = {
  onCreateAccount: () => void
  onSignIn: () => void
  onGuest: () => Promise<void>
}

const STEPS = [
  { label: 'Pick what you have', Icon: SproutIcon },
  { label: 'Discover recipes', Icon: BowlIcon },
  { label: 'Build your book', Icon: OpenBookIcon },
]

export function Welcome({ onCreateAccount, onSignIn, onGuest }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startGuest() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await onGuest()
      // On success the parent shows the home screen.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

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
            <button
              type="button"
              className="auth-guest"
              onClick={startGuest}
              disabled={busy}
            >
              <LeafIcon />
              {busy ? 'Please wait...' : 'Continue as guest'}
            </button>
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : (
              <p className="auth-note">
                As a guest, your books are kept until you sign out, for up to 24
                hours.
              </p>
            )}
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