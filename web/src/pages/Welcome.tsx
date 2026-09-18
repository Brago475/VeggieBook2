import { SafeImage } from '../components/SafeImage'
import { ArrowIcon, LeafIcon } from '../components/AuthIcons'
import { coverSrc } from '../utils/coverSrc'
import { AUTH_PHOTO } from '../utils/authPhoto'

// First screen for a visitor who is not signed in.
//
// Three ways in. An account keeps books on the server, so they are there on
// any device. A guest can use the whole site, but nothing is saved anywhere,
// not on the server and not in the browser. A guest can still create an
// account when their book is finished, and that book is saved into it.
//
// The masthead is hidden on this screen (see App.tsx), so the photograph
// takes the top of the screen and the logo sits under it.

type Props = {
  onCreateAccount: () => void
  onSignIn: () => void
  onGuest: () => void
}

export function Welcome({ onCreateAccount, onSignIn, onGuest }: Props) {
  return (
    <div className="auth-screen">
      {/* eager, not lazy: this is the first thing on the first screen, and
          waiting for it to scroll into view means it is never ready. */}
      <div className="auth-hero">
        <SafeImage src={coverSrc(AUTH_PHOTO)} loading="eager" />
      </div>

      <div className="auth-main">
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

          <div className="auth-or">or</div>

          <button type="button" className="auth-guest" onClick={onGuest}>
            <LeafIcon />
            Continue as guest
          </button>
          <p className="auth-note">As a guest, your books are not saved.</p>
        </div>
      </div>
    </div>
  )
}