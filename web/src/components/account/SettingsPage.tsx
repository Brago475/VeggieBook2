import type { ReactNode } from 'react'
import { ChevronLeftIcon } from '../icons/LibraryIcons'
import { LeafDecor } from '../layout/LeafDecor'
import '../../styles/settings.css'

// The frame around one setting: a link back to the list, a spaced
// SETTINGS label, and the setting's name in the serif, then the setting's
// card. The card's own icon and title are hidden here, since the page
// title says the same.

type Props = {
  kicker: string
  title: string
  backLabel: string
  danger?: boolean
  onBack: () => void
  children: ReactNode
}

export function SettingsPage({ kicker, title, backLabel, danger, onBack, children }: Props) {
  return (
    <div className="account-screen settings-page">
      <LeafDecor className="account-leaf" />
      <LeafDecor className="account-leaf is-small" />

      <button type="button" className="settings-back" onClick={onBack}>
        <ChevronLeftIcon />
        {backLabel}
      </button>

      <div className="settings-head">
        <span className={danger ? 'settings-kicker is-danger' : 'settings-kicker'}>{kicker}</span>
        <h1 className={danger ? 'settings-title is-danger' : 'settings-title'}>{title}</h1>
      </div>

      {children}
    </div>
  )
}