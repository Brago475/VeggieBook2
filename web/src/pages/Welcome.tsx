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
    <div className="account-page">
      <h1 className="account-title">Welcome to VeggieBook</h1>
      <p className="account-text">
        Answer a few questions, keep the recipes you like, and make your own
        book for the vegetable you have.
      </p>
      <p className="account-text">
        Create an account to save your books, so they are here every time you
        come back.
      </p>

      <button type="button" className="create-btn" onClick={onCreateAccount}>
        Create account
      </button>
      <button type="button" className="account-btn" onClick={onSignIn}>
        Sign in
      </button>

      <button type="button" className="link-btn" onClick={onGuest}>
        Continue as guest
      </button>
      <p className="field-hint account-center">
        As a guest, your books are not saved.
      </p>
    </div>
  )
}