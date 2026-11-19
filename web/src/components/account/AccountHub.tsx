import { useEffect, useState, type ReactNode } from 'react'
import { ACCOUNT } from '../../i18n/strings/account'
import { SETTINGS } from '../../i18n/strings/settings'
import { useStrings } from '../../i18n/useStrings'
import { getProfile } from '../../utils/profileApi'
import type { AccountSection } from '../../utils/routes'
import { getTracking, type Tracking } from '../../utils/trackingApi'
import { TrashIcon } from '../icons/AccountIcons'
import { ChevronRightIcon, PersonIcon } from '../icons/LibraryIcons'
import { FlaskIcon } from '../icons/ResearchIcons'
import { LeafDecor } from '../layout/LeafDecor'
import '../../styles/settings.css'

// The list at the top of profile and settings: a green cover with the
// username and email, then one row per setting, grouped under Account and
// Research, and Delete account on its own. Each row opens that setting on
// its own screen. The username and research status load here only to show
// on the rows. Admins are never tracked, so they get no Research row.

type Props = {
  email: string
  isAdmin: boolean
  onOpen: (section: AccountSection) => void
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

function Row({
  icon,
  label,
  value,
  danger,
  onClick,
}: {
  icon: ReactNode
  label: string
  value?: ReactNode
  danger?: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button type="button" className={danger ? 'settings-row is-danger' : 'settings-row'} onClick={onClick}>
        <span className="settings-row-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="settings-row-label">{label}</span>
        {value}
        <ChevronRightIcon className="settings-row-chevron" />
      </button>
    </li>
  )
}

export function AccountHub({ email, isAdmin, onOpen }: Props) {
  const t = useStrings(ACCOUNT)
  const s = useStrings(SETTINGS)

  const [name, setName] = useState<string | null>(null)
  const [tracking, setTrackingState] = useState<Tracking | null>(null)

  useEffect(() => {
    let live = true
    getProfile()
      .then((p) => {
        if (live) setName(p.displayName ?? null)
      })
      .catch(() => {})
    if (!isAdmin) {
      getTracking()
        .then((r) => {
          if (live) setTrackingState(r)
        })
        .catch(() => {})
    }
    return () => {
      live = false
    }
  }, [isAdmin])

  const shown = name || email.split('@')[0]
  const initial = shown.charAt(0).toUpperCase()
  const showResearch = !isAdmin && !(tracking !== null && !tracking.eligible)

  return (
    <>
      <div className="settings-cover">
        <LeafDecor className="settings-cover-leaf" />
        <span className="settings-avatar" aria-hidden="true">
          {initial}
        </span>
        <div className="settings-cover-text">
          <h1 className="settings-cover-name">{shown}</h1>
          <span className="book-card-label">{s.profile}</span>
          <span className="settings-cover-email">{email}</span>
        </div>
      </div>

      <h2 className="settings-group">{s.groupAccount}</h2>
      <ul className="settings-list">
        <Row
          icon={<PersonIcon />}
          label={t.username}
          value={name ? <span className="settings-row-value">{name}</span> : undefined}
          onClick={() => onOpen('username')}
        />
        <Row icon={<LockIcon />} label={s.security} onClick={() => onOpen('security')} />
      </ul>

      {showResearch && (
        <>
          <h2 className="settings-group">{s.groupResearch}</h2>
          <ul className="settings-list">
            <Row
              icon={<FlaskIcon />}
              label={t.rsTitle}
              value={
                tracking && tracking.eligible ? (
                  <span className={tracking.on ? 'settings-chip' : 'settings-chip is-off'}>
                    {tracking.on ? s.on : s.off}
                  </span>
                ) : undefined
              }
              onClick={() => onOpen('research')}
            />
          </ul>
        </>
      )}

      <ul className="settings-list is-alone">
        <Row icon={<TrashIcon />} label={t.delTitle} danger onClick={() => onOpen('delete')} />
      </ul>
    </>
  )
}