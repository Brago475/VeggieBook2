import type { ReactNode } from 'react'
import { NavIcon } from '../icons/NavIcons'

// One Settings section: a white card with a header bar. rootOnly adds the
// small lock and "Main admin only" on the right.

type Props = {
  id: string
  title: string
  rootOnly?: boolean
  aside?: ReactNode
  children: ReactNode
}

export function SettingsCard({ id, title, rootOnly = false, aside, children }: Props) {
  return (
    <section id={id} className="se-card" aria-labelledby={`${id}-title`}>
      <div className="se-card-head">
        <h2 id={`${id}-title`}>{title}</h2>
        {rootOnly ? (
          <span className="se-root">
            <NavIcon name="lock" size={13} />
            Main admin only
          </span>
        ) : (
          aside
        )}
      </div>
      {children}
    </section>
  )
}

// A row inside a card: label and help text on the left, the control on the right.
export function SettingsRow({ label, help, children }: { label: ReactNode; help?: ReactNode; children?: ReactNode }) {
  return (
    <div className="se-row">
      <div className="se-row-text">
        <span className="se-row-label">{label}</span>
        {help && <span className="se-row-help">{help}</span>}
      </div>
      {children && <div className="se-row-control">{children}</div>}
    </div>
  )
}