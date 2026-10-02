import { useState, type FormEvent } from 'react'
import { ArrowIcon, MailIcon } from '../components/icons/AuthIcons'
import { AuthPasswordField } from '../components/forms/AuthPasswordField'
import { AuthShell } from '../components/auth/AuthShell'
import { EmailField } from '../components/forms/EmailField'
import { GuestBooksChoice } from '../components/auth/GuestBooksChoice'
import { PillSelect } from '../components/forms/PillSelect'
import { RecoveryFields } from '../components/auth/RecoveryFields'
import { TermsAgree } from '../components/auth/TermsAgree'
import { TextPillField } from '../components/forms/TextPillField'
import type { RegisterForm } from '../hooks/useAuth'
import { useRecoveryQuestions } from '../hooks/useRecoveryQuestions'
import { checkPassword, PASSWORD_HINT } from '../utils/passwordRule'
import { checkRecovery, EMPTY_RECOVERY, toNewRecovery } from '../utils/recoveryRules'
import { AGE_RANGES, checkName, checkUsername } from '../utils/signUpRules'

// Create Account, in three parts: about you, sign-in details, and account
// recovery (the PIN and security question used by Forgot password). Then
// the 18+ and Terms agreement.
//
// Every rule is checked here first, in the order the form shows them, so
// the first problem is the one shown. The API checks them all again.
//
// Signing up signs in right away, and the parent moves on to home.

type Props = {
  // A guest's saved books. 0 for everyone else, which hides the choice.
  guestBookCount: number
  onSubmit: (form: RegisterForm) => Promise<void>
  onSignIn: () => void
  onBack?: () => void
}

export function CreateAccount({ guestBookCount, onSubmit, onSignIn, onBack }: Props) {
  const hasGuestBooks = guestBookCount > 0
  const { questions, error: questionsError } = useRecoveryQuestions()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [emailAgain, setEmailAgain] = useState('')
  const [password, setPassword] = useState('')
  const [passwordAgain, setPasswordAgain] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [recovery, setRecovery] = useState(EMPTY_RECOVERY)
  const [agree, setAgree] = useState(false)
  const [keepBooks, setKeepBooks] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function check(): string | null {
    return (
      checkName(firstName, 'first name') ??
      checkName(lastName, 'last name') ??
      checkUsername(username) ??
      (email.trim() ? null : 'Enter your email address.') ??
      (email.trim().toLowerCase() === emailAgain.trim().toLowerCase()
        ? null
        : 'The two email addresses do not match.') ??
      checkPassword(password) ??
      (password === passwordAgain ? null : 'The two passwords do not match.') ??
      (ageRange ? null : 'Please choose your age range.') ??
      checkRecovery(recovery) ??
      (agree
        ? null
        : 'Please confirm you are 18 or older and agree to the Terms of Use and Privacy Policy.')
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return

    const problem = check()
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    setError(null)
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: username.trim(),
        email: email.trim(),
        password,
        ageRange,
        ...toNewRecovery(recovery),
        agreeToTerms: true,
        keepGuestBooks: hasGuestBooks && keepBooks,
      })
      // On success the parent moves on to the home screen.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <AuthShell onBack={onBack}>
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="auth-head">
          <h1 className="auth-greeting">Create an account</h1>
          <p className="auth-sub">Your books are kept in your account, on any device.</p>
        </div>

        <div className="auth-fields">
          <h2 className="auth-section-title">About you</h2>

          <TextPillField
            id="reg-first"
            label="First name"
            value={firstName}
            onChange={setFirstName}
            autoComplete="given-name"
            autoCapitalize="words"
            maxLength={50}
          />
          <TextPillField
            id="reg-last"
            label="Last name"
            value={lastName}
            onChange={setLastName}
            autoComplete="family-name"
            autoCapitalize="words"
            maxLength={50}
          />
          <TextPillField
            id="reg-username"
            label="Username (optional)"
            value={username}
            onChange={setUsername}
            autoComplete="nickname"
            autoCapitalize="none"
            maxLength={20}
            required={false}
            hint="3 to 20 letters, numbers, or underscores. Leave it blank and we'll make one for you."
          />

          <h2 className="auth-section-title">Sign-in details</h2>

          <EmailField id="reg-email" value={email} onChange={setEmail} />
          <TextPillField
            id="reg-email-again"
            label="Confirm email address"
            type="email"
            icon={<MailIcon />}
            value={emailAgain}
            onChange={setEmailAgain}
            autoComplete="off"
            autoCapitalize="none"
            maxLength={254}
          />

          <AuthPasswordField
            id="reg-password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            hint={PASSWORD_HINT}
          />
          <AuthPasswordField
            id="reg-password-again"
            label="Confirm password"
            value={passwordAgain}
            onChange={setPasswordAgain}
            autoComplete="new-password"
          />

          <PillSelect
            id="reg-age"
            label="Age range"
            value={ageRange}
            onChange={setAgeRange}
            placeholder="Choose your age range"
            options={AGE_RANGES}
          />

          <h2 className="auth-section-title">Account recovery</h2>
          <p className="auth-section-text">
            If you forget your password, you'll use your PIN, or your security question
            if you forget the PIN too. Keep them to yourself.
          </p>

          <RecoveryFields
            idPrefix="reg"
            value={recovery}
            onChange={setRecovery}
            questions={questions}
          />
          {questionsError && (
            <p className="form-error" role="alert">
              {questionsError}
            </p>
          )}

          {hasGuestBooks && (
            <GuestBooksChoice
              count={guestBookCount}
              keep={keepBooks}
              onChange={setKeepBooks}
              whenMoved="right away"
            />
          )}

          <TermsAgree checked={agree} onChange={setAgree} />

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="auth-primary" disabled={busy}>
            {busy ? 'Please wait...' : 'Create account'}
            {!busy && <ArrowIcon />}
          </button>

          <p className="auth-switch">
            Already have an account?{' '}
            <button type="button" className="link-btn" onClick={onSignIn}>
              Sign in
            </button>
          </p>
        </div>
      </form>
    </AuthShell>
  )
}