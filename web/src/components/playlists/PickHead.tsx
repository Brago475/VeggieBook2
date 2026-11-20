import type { ReactNode } from 'react'

// The top of the picker and edit screens: a small spaced-out label, the
// playlist name as the title (passed in as children), and one short line.

type Props = {
  kicker: string
  sub?: string
  children: ReactNode
}

export function PickHead({ kicker, sub, children }: Props) {
  return (
    <div className="library-head pk-head">
      <div className="library-head-text">
        <p className="pk-kicker">{kicker}</p>
        {children}
        {sub && <p className="library-sub">{sub}</p>}
      </div>
    </div>
  )
}