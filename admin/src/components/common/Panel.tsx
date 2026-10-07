import type { ReactNode } from 'react'
import { StatIcon, type StatIconName } from '../icons/StatIcons'
import '../../styles/panels.css'

// A card with a standard header: an icon, a title, an optional short line
// under it, and optional actions on the right. Every analytics panel uses
// it, so they all read the same way.

type Props = {
  title: string
  icon?: StatIconName
  description?: string
  aside?: ReactNode
  className?: string
  children: ReactNode
}

export function Panel({ title, icon, description, aside, className, children }: Props) {
  return (
    <section className={className ? `card panel ${className}` : 'card panel'}>
      <header className="panel-head">
        {icon && (
          <span className="panel-icon">
            <StatIcon name={icon} size={22} />
          </span>
        )}
        <div className="panel-heading">
          <h2 className="panel-title">{title}</h2>
          {description && <p className="panel-desc">{description}</p>}
        </div>
        {aside && <div className="panel-aside">{aside}</div>}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  )
}