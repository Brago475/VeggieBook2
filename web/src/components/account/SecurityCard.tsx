import { useEffect, useState } from 'react'
import { useHeld } from '../../hooks/useHeld'
import { useLang } from '../../i18n/languageContext'
import { ACCOUNT } from '../../i18n/strings/account'
import { questionText } from '../../i18n/strings/questions'
import { useStrings } from '../../i18n/useStrings'
import { getRecoverySettings, type RecoverySettings } from '../../utils/authApi'
import { KeyIcon, LockIcon } from '../icons/LibraryIcons'
import { AccountCardSkeleton, AccountTextSkeleton } from './AccountCardSkeleton'
import { ChangePasswordForm } from './ChangePasswordForm'
import { RecoveryForm } from './RecoveryForm'
import '../../styles/security-card.css'

// Password and recovery, on the account settings screen. One card:
//
//   summary   password, recovery PIN and security question, each shown once,
//             with Change password, Forgot password, and Change PIN and
//             question
//   change    current password, then a new password
//   forgot    recovery PIN, then a new password (only when a PIN is set)
//   recovery  current password, then a new PIN and question
//
// Only one form is open at a time. Finishing or cancelling returns to the
// summary, with a short message after a change. The recovery-card class
// keeps the form styles in recovery-card.css.

type Mode = 'summary' | 'change' | 'forgot' | 'recovery'

type Props = {
  email: string
  onChangePassword: (ticket: string, newPassword: string) => Promise<void>
}

export function SecurityCard({ email, onChangePassword }: Props) {
  const { lang } = useLang()
  const t = useStrings(ACCOUNT)

  const [settings, setSettings] = useState<RecoverySettings | null>(null)
  const [loadFailed, setLoadFailed] = useState<{ message: string | null } | null>(null)
  const [mode, setMode] = useState<Mode>('summary')
  const [notice, setNotice] = useState<string | null>(null)

  const held = useHeld(settings === null && loadFailed === null)
  const loadError = loadFailed ? (loadFailed.message ?? t.loadCardError) : null

  useEffect(() => {
    let cancelled = false
    getRecoverySettings()
      .then((s) => {
        if (!cancelled) setSettings(s)
      })
      .catch((err) => {
        if (!cancelled) setLoadFailed({ message: err instanceof Error ? err.message : null })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const hasPin = settings?.hasPin === true
  const isSet = settings !== null && settings.hasPin && settings.question !== null

  // The question in the site language, by its id.
  const questionShown =
    isSet && settings.questionId !== null
      ? questionText(lang, settings.questionId, settings.question ?? '')
      : null

  function open(next: Mode) {
    setNotice(null)
    setMode(next)
  }

  function finish(message: string | null) {
    setMode('summary')
    setNotice(message)
  }

  const head = {
    summary: { title: t.prTitle, sub: t.prSub },
    change: { title: t.cpTitle, sub: t.cpSub },
    forgot: { title: t.fgTitle, sub: t.fgSub },
    recovery: { title: isSet ? t.rcChange : t.rcSetButton, sub: t.rcSub },
  }[mode]

  return (
    <div className="account-card security-card recovery-card" aria-busy={held}>
      <div className="account-card-head">
        <span className="account-card-icon">
          {mode === 'recovery' ? <KeyIcon /> : <LockIcon />}
        </span>
        <div className="account-card-head-text">
          <h2 className="account-card-title">{head.title}</h2>
          <p className="account-card-text">{head.sub}</p>
        </div>
      </div>

      {mode === 'summary' && (
        <>
          {held ? (
            <>
              <AccountTextSkeleton lines={3} />
              <AccountCardSkeleton />
            </>
          ) : (
            <dl className="security-rows">
              <div className="security-row">
                <dt>{t.prPassword}</dt>
                <dd>{t.prSet}</dd>
              </div>
              <div className="security-row">
                <dt>{t.prPin}</dt>
                <dd>{hasPin ? t.prSet : t.prNotSet}</dd>
              </div>
              <div className="security-row">
                <dt>{t.prQuestion}</dt>
                <dd>{questionShown ?? t.prNotSet}</dd>
              </div>
            </dl>
          )}

          {settings !== null && !isSet && !held && <p className="account-card-text">{t.rcNotSet}</p>}

          {loadError && (
            <p className="form-error" role="alert">
              {loadError}
            </p>
          )}
          {notice && (
            <p className="form-success" role="status">
              {notice}
            </p>
          )}

          <div className={hasPin ? 'security-actions' : 'security-actions is-single'}>
            <button type="button" className="account-primary" onClick={() => open('change')}>
              {t.cpTitle}
            </button>
            {hasPin && (
              <button
                type="button"
                className="account-primary security-secondary"
                onClick={() => open('forgot')}
              >
                {t.prForgot}
              </button>
            )}
          </div>

          {settings !== null && !held && (
            <button type="button" className="link-btn" onClick={() => open('recovery')}>
              {isSet ? t.rcChange : t.rcSetButton}
            </button>
          )}
        </>
      )}

      {mode === 'change' && (
        <ChangePasswordForm
          email={email}
          proof="password"
          onChangePassword={onChangePassword}
          onDone={() => finish(t.cpDone)}
          onCancel={() => finish(null)}
          onForgot={hasPin ? () => open('forgot') : undefined}
        />
      )}

      {mode === 'forgot' && (
        <ChangePasswordForm
          email={email}
          proof="pin"
          onChangePassword={onChangePassword}
          onDone={() => finish(t.cpDone)}
          onCancel={() => finish(null)}
        />
      )}

      {mode === 'recovery' && (
        <RecoveryForm
          onSaved={(saved) => {
            setSettings(saved)
            finish(t.rcSaved)
          }}
          onCancel={() => finish(null)}
        />
      )}
    </div>
  )
}