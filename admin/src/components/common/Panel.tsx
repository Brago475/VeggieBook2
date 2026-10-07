import type { ReactNode } from 'react'
import '../../styles/panels.css'

// A card with a standard header: a title, one line saying what it shows,
// and optional actions on the right. Every analytics panel uses it, so
// they all read the same way.

type Props = {
  title: string
  description?: string
  aside?: ReactNode
  className?: string
  children: ReactNode
}

export function Panel({ title, description, aside, className, children }: Props) {
  return (
    <section className={className ? `card panel ${className}` : 'card panel'}>
      <header className="panel-head">
        <div>
          <h2 className="panel-title">{title}</h2>
          {description && <p className="panel-desc">{description}</p>}
        </div>
        {aside && <div className="panel-aside">{aside}</div>}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  )
}