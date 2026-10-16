import type { ReactNode } from 'react'
import '../../styles/panels.css'

// A white box with a plain heading and optional actions on the right.

type Props = {
  title: string
  aside?: ReactNode
  children: ReactNode
}

export function Panel({ title, aside, children }: Props) {
  return (
    <section className="card panel">
      <header className="panel-head">
        <h2 className="panel-title">{title}</h2>
        {aside}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  )
}