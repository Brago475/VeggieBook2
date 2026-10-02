import { useEffect, useState, type FormEvent } from 'react'
import { getProfile, notifyProfileChanged, saveProfile, type Profile } from '../utils/profileApi'
import { checkName, checkUsername } from '../utils/signUpRules'
import { PersonIcon } from './LibraryIcons'

// Profile, at the top of account settings: first name, last name, and
// username, which can be changed here. The email is shown but not changed.
//
// The rules match Create Account, except the username can't be blank.

export function ProfileCard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

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
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : 'Could not load your profile.')
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
      checkName(firstName, 'first name') ??
      checkName(lastName, 'last name') ??
      (username.trim() ? null : 'Please enter a username.') ??
      checkUsername(username)
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
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="account-card" onSubmit={submit} noValidate>
      <div className="account-card-head">
        <span className="account-card-icon">
          <PersonIcon />
        </span>
        <div className="account-card-head-text">
          <h2 className="account-card-title">Profile</h2>
          <p className="account-card-text">
            {profile?.email ? `Signed in with ${profile.email}` : 'Your name and username.'}
          </p>
        </div>
      </div>

      {loadError && (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      )}

      {profile && (
        <>
          <div className="field">
            <label className="field-label" htmlFor="profile-first">
              First name
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
              Last name
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
              Username
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
              3 to 20 letters, numbers, or underscores. This is the name shown on your home
              screen.
            </p>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {done && (
            <p className="form-success" role="status">
              Profile saved.
            </p>
          )}

          <button type="submit" className="account-primary" disabled={busy || !changed}>
            {busy ? 'Saving...' : 'Save profile'}
          </button>
        </>
      )}
    </form>
  )
}