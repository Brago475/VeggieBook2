import { useState, type FormEvent } from 'react'
import { ArrowIcon } from '../components/icons/AuthIcons'
import { AuthPasswordField } from '../components/forms/AuthPasswordField'
import { AuthShell } from '../components/auth/AuthShell'
import { EmailField } from '../components/forms/EmailField'
import { GuestBooksChoice } from '../components/auth/GuestBooksChoice'
import { AUTH } from '../i18n/strings/auth'
import { COMMON } from '../i18n/strings/common'
import { useStrings } from '../i18n/useStrings'

// Sign in. Create Account has its own page (CreateAccount.tsx), since it
// asks for much more.
//
// A guest with saved books chooses what happens to them (GuestBooksChoice).
//
// Errors from the API are already written for the user (see utils/api.ts),
// so they are shown as they come.

type Props = {
  // A guest's saved books. 0 for everyone else, which hides the choice.
  guestBookCount: number
  onSubmit: (email: string, password: string, keepGuestBooks: boolean) => Promise<void>
  onForgotPassword: () => void
  onCreateAccount: () => void
  onBack?: () => void
}

export function AuthForm({
  guestBookCount,
  onSubmit,
  onForgotPassword,
  onCreateAccount,
  onBack,
}: Props) {
  const t = useStrings(AUTH)
  const common = useStrings(COMMON)
  const hasGuestBooks = guestBookCount > 0

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepBooks, setKeepBooks] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    setBusy(true)
    setError(null)
    try {
      await onSubmit(email.trim(), password, hasGuestBooks && keepBooks)
      // On success the parent moves on to the home screen.
    } catch (err) {
      setError(err instanceof Error ? err.message : common.somethingWrong)
      setBusy(false)
    }
  }

  return (
    <AuthShell onBack={onBack}>
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="auth-head">
          <h1 className="auth-greeting">{t.welcomeBack}</h1>
          <p className="auth-sub">{t.signInSub}</p>
        </div>

        <div className="auth-fields">
          <EmailField id="auth-email" value={email} onChange={setEmail} />

          <AuthPasswordField
            id="auth-password"
            label={t.password}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          <p className="auth-forgot">
            <button type="button" className="link-btn" onClick={onForgotPassword}>
              {t.forgot}
            </button>
          </p>

          {hasGuestBooks && (
            <GuestBooksChoice count={guestBookCount} keep={keepBooks} onChange={setKeepBooks} />
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="auth-primary" disabled={busy}>
            {busy ? common.pleaseWait : t.signIn}
            {!busy && <ArrowIcon />}
          </button>

          <p className="auth-switch">
            {t.newHere}{' '}
            <button type="button" className="link-btn" onClick={onCreateAccount}>
              {t.createAnAccount}
            </button>
          </p>
        </div>
      </form>
    </AuthShell>
  )
}