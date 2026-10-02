import { useState, type FormEvent } from 'react'
import { verifyForPasswordChange } from '../../utils/authApi'
import { checkPassword, PASSWORD_HINT } from '../../utils/passwordRule'
import { LockIcon } from '../icons/LibraryIcons'
import { PasswordField } from '../forms/PasswordField'
import { PinField } from '../forms/PinField'

// Change password, on the account settings screen, in two steps:
//
//   verify  prove it's you: the current password, or "Use your PIN instead"
//           for someone who forgot it. A wrong PIN can be tried again, up
//           to 3 times a day (shared with Forgot password).
//   choose  the new password, twice.
//
// The current password box is not filled in by the browser on its own, so
// its eye only shows what the person typed, never a saved password.
//
// On success the API gives this device a fresh session and signs out every
// other one, and the card goes back to the first step.

type Props = {
  email: string
  onChangePassword: (ticket: string, newPassword: string) => Promise<void>
}

type Step = 'verify' | 'choose'
type Proof = 'password' | 'pin'

export function ChangePasswordForm({ email, onChangePassword }: Props) {
  const [step, setStep] = useState<Step>('verify')
  const [proof, setProof] = useState<Proof>('password')
  const [current, setCurrent] = useState('')
  const [pin, setPin] = useState('')
  const [ticket, setTicket] = useState<string | null>(null)
  const [next, setNext] = useState('')
  const [nextAgain, setNextAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function reset() {
    setStep('verify')
    setProof('password')
    setCurrent('')
    setPin('')
    setTicket(null)
    setNext('')
    setNextAgain('')
    setError(null)
  }

  function switchProof(to: Proof) {
    setProof(to)
    setCurrent('')
    setPin('')
    setError(null)
    setDone(false)
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setDone(false)

    const problem =
      proof === 'password'
        ? current
          ? null
          : 'Enter your current password.'
        : pin.length === 6
          ? null
          : 'Enter your 6-digit PIN.'
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    setError(null)
    try {
      const t = await verifyForPasswordChange(
        proof === 'password' ? { currentPassword: current } : { pin },
      )
      setTicket(t)
      setCurrent('')
      setPin('')
      setStep('choose')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
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
      checkPassword(next) ?? (next === nextAgain ? null : 'The two passwords do not match.')
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    setError(null)
    try {
      await onChangePassword(ticket, next)
      reset()
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const head = (
    <div className="account-card-head">
      <span className="account-card-icon">
        <LockIcon />
      </span>
      <div className="account-card-head-text">
        <h2 className="account-card-title">Change password</h2>
        <p className="account-card-text">
          {step === 'verify'
            ? 'First, confirm it is you.'
            : 'Now choose your new password.'}
        </p>
      </div>
    </div>
  )

  const messages = (
    <>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="form-success" role="status">
          Password changed. You were signed out on your other devices.
        </p>
      )}
    </>
  )

  if (step === 'choose') {
    return (
      <form className="account-card" onSubmit={change} noValidate>
        {head}

        {/* Lets password managers save the new password under this email. */}
        <input type="email" autoComplete="username" value={email} readOnly hidden />

        <PasswordField
          id="new-password"
          label="New password"
          autoComplete="new-password"
          placeholder="Enter a new password"
          hint={PASSWORD_HINT}
          value={next}
          onChange={setNext}
        />
        <PasswordField
          id="new-password-again"
          label="Confirm new password"
          autoComplete="new-password"
          value={nextAgain}
          onChange={setNextAgain}
        />

        {messages}

        <button type="submit" className="account-primary" disabled={busy}>
          {busy ? 'Changing...' : 'Change password'}
        </button>
        <button type="button" className="link-btn" onClick={reset} disabled={busy}>
          Cancel
        </button>
      </form>
    )
  }

  return (
    <form className="account-card" onSubmit={verify} noValidate>
      {head}

      {proof === 'password' ? (
        <PasswordField
          id="current-password"
          label="Current password"
          autoComplete="off"
          value={current}
          onChange={setCurrent}
          noAutofill
        />
      ) : (
        <PinField
          id="change-pin"
          label="Your 6-digit recovery PIN"
          value={pin}
          onChange={setPin}
          variant="card"
        />
      )}

      {messages}

      <button type="submit" className="account-primary" disabled={busy}>
        {busy ? 'Checking...' : 'Continue'}
      </button>

      {proof === 'password' ? (
        <button type="button" className="link-btn" onClick={() => switchProof('pin')}>
          Forgot your current password? Use your PIN instead
        </button>
      ) : (
        <button type="button" className="link-btn" onClick={() => switchProof('password')}>
          Use my current password instead
        </button>
      )}
    </form>
  )
}