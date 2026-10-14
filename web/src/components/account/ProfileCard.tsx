import { useEffect, useState, type FormEvent } from 'react'
import { useHeld } from '../../hooks/useHeld'
import { useLang } from '../../i18n/languageContext'
import { ACCOUNT } from '../../i18n/strings/account'
import { AUTH } from '../../i18n/strings/auth'
import { COMMON } from '../../i18n/strings/common'
import { useStrings } from '../../i18n/useStrings'
import { getProfile, notifyProfileChanged, saveProfile, type Profile } from '../../utils/profileApi'
import { checkName, checkUsername } from '../../utils/signUpRules'
import { PersonIcon } from '../icons/LibraryIcons'
import { AccountCardSkeleton, AccountTextSkeleton } from './AccountCardSkeleton'

// Profile, at the top of account settings: first name, last name, and
// username, which can be changed here. The email is shown but not changed.
// Outlines show while the profile loads.
//
// The rules match Create Account, except the username can't be blank.

export function ProfileCard() {
  const { lang } = useLang()
  const t = useStrings(ACCOUNT)
  const auth = useStrings(AUTH)
  const common = useStrings(COMMON)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadFailed, setLoadFailed] = useState<{ message: string | null } | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const held = useHeld(profile === null && loadFailed === null)
  const ready = profile !== null && !held
  const loadError = loadFailed ? (loadFailed.message ?? t.loadProfileError) : null

  function fill(p: Profile) {
    setProfile(p)
    setFirstName(p.firstName ?? '')
    setLastName(p.lastName ?? '')
    setUsername(p.displayName ?? '')
  }

  useEffect(() => {
    let cancelled = false
    getProfile()
      .then((p) => {
        if (!cancelled) fill(p)
      })
      .catch((err) => {
        if (!cancelled) setLoadFailed({ message: err instanceof Error ? err.message : null })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const changed =
    profile !== null &&
    (firstName.trim() !== (profile.firstName ?? '') ||
      lastName.trim() !== (profile.lastName ?? '') ||
      username.trim() !== (profile.displayName ?? ''))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setDone(false)

    const problem =
      checkName(firstName, 'first name', lang) ??
      checkName(lastName, 'last name', lang) ??
      (username.trim() ? null : t.enterUsername) ??
      checkUsername(username, lang)
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    setError(null)
    try {
      fill(await saveProfile(firstName.trim(), lastName.trim(), username.trim()))
      notifyProfileChanged()
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : common.somethingWrong)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="account-card" onSubmit={submit} noValidate aria-busy={held}>
      <div className="account-card-head">
        <span className="account-card-icon">
          <PersonIcon />
        </span>
        <div className="account-card-head-text">
          <h2 className="account-card-title">{t.profileTitle}</h2>
          {held ? (
            <AccountTextSkeleton />
          ) : (
            <p className="account-card-text">
              {profile?.email ? t.signedInWith(profile.email) : t.profileFallback}
            </p>
          )}
        </div>
      </div>

      {loadError && (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      )}

      {held && <AccountCardSkeleton fields={3} />}

      {ready && (
        <>
          <div className="field">
            <label className="field-label" htmlFor="profile-first">
              {auth.firstName}
            </label>
            <input
              id="profile-first"
              className="field-input"
              type="text"
              autoComplete="given-name"
              maxLength={50}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="profile-last">
              {auth.lastName}
            </label>
            <input
              id="profile-last"
              className="field-input"
              type="text"
              autoComplete="family-name"
              maxLength={50}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="profile-username">
              {t.username}
            </label>
            <input
              id="profile-username"
              className="field-input"
              type="text"
              autoComplete="nickname"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={20}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-describedby="profile-username-hint"
            />
            <p className="field-hint" id="profile-username-hint">
              {t.usernameHint}
            </p>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {done && (
            <p className="form-success" role="status">
              {t.profileSaved}
            </p>
          )}

          <button type="submit" className="account-primary" disabled={busy || !changed}>
            {busy ? t.saving : t.saveProfile}
          </button>
        </>
      )}
    </form>
  )
}