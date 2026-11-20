import type { ReactNode } from 'react'
import { LeafDecor } from '../layout/LeafDecor'
import '../../styles/settings.css'

// The frame around one setting: a spaced SETTINGS label and the setting's
// name, then the setting's card. The card's own icon and title are hidden
// here, since the page title says the same. Going back to the list is the
// Back button in the green bar.

type Props = {
  kicker: string
  title: string
  danger?: boolean
  children: ReactNode
}

export function SettingsPage({ kicker, title, danger, children }: Props) {
  return (
    <div className="account-screen settings-page">
      <LeafDecor className="account-leaf" />
      <LeafDecor className="account-leaf is-small" />

      <div className="settings-head">
        <span className={danger ? 'settings-kicker is-danger' : 'settings-kicker'}>{kicker}</span>
        <h1 className={danger ? 'settings-title is-danger' : 'settings-title'}>{title}</h1>
      </div>

      {children}
    </div>
  )
}