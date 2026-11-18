import { useState, type FormEvent } from 'react'
import { useLang } from '../../i18n/languageContext'
import { ACCOUNT } from '../../i18n/strings/account'
import { AUTH } from '../../i18n/strings/auth'
import { COMMON } from '../../i18n/strings/common'
import { FORGOT } from '../../i18n/strings/forgot'
import { useStrings } from '../../i18n/useStrings'
import { verifyForPasswordChange } from '../../utils/authApi'
import { checkPassword, passwordHint } from '../../utils/passwordRule'
import { PasswordField } from '../forms/PasswordField'
import { PinField } from '../forms/PinField'

// The change password form inside SecurityCard, in two steps:
//
//   verify  the current password ("Change password") or the recovery PIN
//           ("Forgot password"). A wrong PIN counts toward the 3 tries a
//           day shared with the sign-in screen's Forgot password.
//   choose  the new password, twice.
//
// On success the API gives this device a fresh session and signs out every
// other one, and the card goes back to its summary.

type Proof = 'password' | 'pin'

type Props = {
  email: string
  proof: Proof
  onChangePassword: (ticket: string, newPassword: string) => Promise<void>
  onDone: () => void
  onCancel: () => void
  // Shown on the password step only, when a PIN is set.
  onForgot?: () => void
}

export function ChangePasswordForm({
  email,
  proof,
  onChangePassword,
  onDone,
  onCancel,
  onForgot,
}: Props) {
  const { lang } = useLang()
  const t = useStrings(ACCOUNT)
  const auth = useStrings(AUTH)
  const forgot = useStrings(FORGOT)
  const common = useStrings(COMMON)

  const [ticket, setTicket] = useState<string | null>(null)
  const [current, setCurrent] = useState('')
  const [pin, setPin] = useState('')
  const [next, setNext] = useState('')
  const [nextAgain, setNextAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    const problem =
      proof === 'password'
        ? current
          ? null
          : t.enterCurrent
        : pin.length === 6
          ? null
          : forgot.enterPin
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    setError(null)
    try {
      const issued = await verifyForPasswordChange(
        proof === 'password' ? { currentPassword: current } : { pin },
      )
      setTicket(issued)
      setCurrent('')
      setPin('')
    } catch (err) {
      setError(err instanceof Error ? err.message : common.somethingWrong)
      // A wrong PIN is cleared so it can be typed again.
      setPin('')
    } finally {
      setBusy(false)
    }
  }

  async function change(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !ticket) return

    const problem =
      checkPassword(next, lang) ?? (next === nextAgain ? null : auth.passwordsDiffer)
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    setError(null)
    try {
      await onChangePassword(ticket, next)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : common.somethingWrong)
      setBusy(false)
    }
  }

  const errorLine = error && (
    <p className="form-error" role="alert">
      {error}
    </p>
  )

  if (ticket) {
    return (
      <form className="security-form" onSubmit={change} noValidate>
        {/* Lets password managers save the new password under this email. */}
        <input type="email" autoComplete="username" value={email} readOnly hidden />

        <PasswordField
          id="new-password"
          label={forgot.newPassword}
          autoComplete="new-password"
          placeholder={t.newPasswordPlaceholder}
          hint={passwordHint(lang)}
          value={next}
          onChange={setNext}
        />
        <PasswordField
          id="new-password-again"
          label={forgot.confirmNewPassword}
          autoComplete="new-password"
          value={nextAgain}
          onChange={setNextAgain}
        />

        {errorLine}

        <button type="submit" className="account-primary" disabled={busy}>
          {busy ? t.changing : t.cpTitle}
        </button>
        <button type="button" className="link-btn" onClick={onCancel} disabled={busy}>
          {common.cancel}
        </button>
      </form>
    )
  }

  return (
    <form className="security-form" onSubmit={verify} noValidate>
      {proof === 'password' ? (
        <PasswordField
          id="current-password"
          label={t.currentPassword}
          autoComplete="off"
          value={current}
          onChange={setCurrent}
          noAutofill
        />
      ) : (
        <PinField id="change-pin" label={t.yourPin} value={pin} onChange={setPin} variant="card" />
      )}

      {errorLine}

      <button type="submit" className="account-primary" disabled={busy}>
        {busy ? t.checking : forgot.continue}
      </button>

      {proof === 'password' && onForgot && (
        <button type="button" className="link-btn" onClick={onForgot} disabled={busy}>
          {t.forgotCurrent}
        </button>
      )}
      <button type="button" className="link-btn" onClick={onCancel} disabled={busy}>
        {common.cancel}
      </button>
    </form>
  )
}