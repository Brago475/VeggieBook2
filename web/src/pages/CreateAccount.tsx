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
import { useLang } from '../i18n/languageContext'
import { AUTH } from '../i18n/strings/auth'
import { COMMON } from '../i18n/strings/common'
import { useStrings } from '../i18n/useStrings'
import { checkPassword, PASSWORD_HINT } from '../utils/passwordRule'
import { checkRecovery, EMPTY_RECOVERY, toNewRecovery } from '../utils/recoveryRules'
import { ageRanges, checkName, checkUsername } from '../utils/signUpRules'

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
  const { lang } = useLang()
  const t = useStrings(AUTH)
  const common = useStrings(COMMON)
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
      checkName(firstName, 'first name', lang) ??
      checkName(lastName, 'last name', lang) ??
      checkUsername(username, lang) ??
      (email.trim() ? null : t.enterEmail) ??
      (email.trim().toLowerCase() === emailAgain.trim().toLowerCase() ? null : t.emailsDiffer) ??
      checkPassword(password) ??
      (password === passwordAgain ? null : t.passwordsDiffer) ??
      (ageRange ? null : t.chooseAgeError) ??
      checkRecovery(recovery) ??
      (agree ? null : t.agreeError)
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
      setError(err instanceof Error ? err.message : common.somethingWrong)
      setBusy(false)
    }
  }

  return (
    <AuthShell onBack={onBack}>
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="auth-head">
          <h1 className="auth-greeting">{t.createTitle}</h1>
          <p className="auth-sub">{t.createSub}</p>
        </div>

        <div className="auth-fields">
          <h2 className="auth-section-title">{t.aboutYou}</h2>

          <TextPillField
            id="reg-first"
            label={t.firstName}
            value={firstName}
            onChange={setFirstName}
            autoComplete="given-name"
            autoCapitalize="words"
            maxLength={50}
          />
          <TextPillField
            id="reg-last"
            label={t.lastName}
            value={lastName}
            onChange={setLastName}
            autoComplete="family-name"
            autoCapitalize="words"
            maxLength={50}
          />
          <TextPillField
            id="reg-username"
            label={t.usernameOptional}
            value={username}
            onChange={setUsername}
            autoComplete="nickname"
            autoCapitalize="none"
            maxLength={20}
            required={false}
            hint={t.usernameHint}
          />

          <h2 className="auth-section-title">{t.signInDetails}</h2>

          <EmailField id="reg-email" value={email} onChange={setEmail} />
          <TextPillField
            id="reg-email-again"
            label={t.confirmEmail}
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
            label={t.password}
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            hint={PASSWORD_HINT}
          />
          <AuthPasswordField
            id="reg-password-again"
            label={t.confirmPassword}
            value={passwordAgain}
            onChange={setPasswordAgain}
            autoComplete="new-password"
          />

          <PillSelect
            id="reg-age"
            label={t.ageRange}
            value={ageRange}
            onChange={setAgeRange}
            placeholder={t.chooseAge}
            options={ageRanges(lang)}
          />

          <h2 className="auth-section-title">{t.recoveryTitle}</h2>
          <p className="auth-section-text">{t.recoveryText}</p>

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
            <GuestBooksChoice count={guestBookCount} keep={keepBooks} onChange={setKeepBooks} />
          )}

          <TermsAgree checked={agree} onChange={setAgree} />

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="auth-primary" disabled={busy}>
            {busy ? common.pleaseWait : t.createAccount}
            {!busy && <ArrowIcon />}
          </button>

          <p className="auth-switch">
            {t.haveAccount}{' '}
            <button type="button" className="link-btn" onClick={onSignIn}>
              {t.signIn}
            </button>
          </p>
        </div>
      </form>
    </AuthShell>
  )
}