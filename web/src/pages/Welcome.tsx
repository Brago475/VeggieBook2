// First screen for a visitor who is not signed in.
//
// Three ways in. An account keeps books on the server, so they are there on
// any device. A guest can use the whole site, but nothing is saved anywhere,
// not on the server and not in the browser. A guest can still create an
// account when their book is finished, and that book is saved into it.

type Props = {
  onCreateAccount: () => void
  onSignIn: () => void
  onGuest: () => void
}

export function Welcome({ onCreateAccount, onSignIn, onGuest }: Props) {
  return (
    <div className="auth-screen">
      <div className="auth-head">
        <h1 className="auth-greeting">Welcome</h1>
        <p className="auth-sub">
          Make your own book for the vegetable you have.
        </p>
      </div>

      <div className="auth-fields">
        <button type="button" className="create-btn" onClick={onCreateAccount}>
          Create account
        </button>
        <button type="button" className="account-btn" onClick={onSignIn}>
          Sign in
        </button>
        <p className="auth-note">
          An account saves your books, so they are here when you come back.
        </p>
      </div>

      <div className="auth-alt">
        <button type="button" className="link-btn" onClick={onGuest}>
          Continue as guest
        </button>
        <p className="auth-note">As a guest, your books are not saved.</p>
      </div>
    </div>
  )
}