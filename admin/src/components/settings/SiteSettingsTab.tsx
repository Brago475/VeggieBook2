import { useEffect, useState, type MouseEvent } from 'react'
import type { SiteSettingsInfo } from '../../types/settings'
import { BlockSkeleton } from '../skeletons/BlockSkeleton'
import { AdminsSection } from './AdminsSection'
import { GuestsSection } from './GuestsSection'
import { IdentitySection } from './IdentitySection'
import { ResearchSection } from './ResearchSection'
import { SystemSection } from './SystemSection'
import { YourAccountSection } from './YourAccountSection'

// Settings, Site settings tab. Admins and Identity records render for the
// root admin only, and their routes refuse everyone else. The side list
// marks the section in view, like the main sidebar marks the open page.

type Props = {
  info: SiteSettingsInfo | null
  ready: boolean
  isRoot: boolean
  email: string
  onChanged: () => void
  onSignOut: () => Promise<void>
}

type Section = { id: string; label: string }

const rootSections: Section[] = [
  { id: 'admins', label: 'Admins' },
  { id: 'identity', label: 'Identity records' },
]

const allSections: Section[] = [
  { id: 'research', label: 'Research' },
  { id: 'guests', label: 'Guests' },
  { id: 'system', label: 'System' },
  { id: 'account', label: 'Your account' },
]

export function SiteSettingsTab({ info, ready, isRoot, email, onChanged, onSignOut }: Props) {
  const ids = [...(isRoot ? rootSections : []), ...allSections].map((s) => s.id)
  const [active, setActive] = useState(ids[0])
  const idList = ids.join(',')

  // Marks the section nearest the top of the screen.
  useEffect(() => {
    const targets = idList
      .split(',')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -65% 0px' },
    )
    targets.forEach((t) => observer.observe(t))
    return () => observer.disconnect()
  }, [idList, ready])

  function jump(e: MouseEvent, id: string) {
    e.preventDefault()
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function link(s: Section) {
    return (
      <a
        key={s.id}
        href={`#settings-${s.id}`}
        aria-current={active === s.id ? 'true' : undefined}
        className={active === s.id ? 'se-nav-item is-active' : 'se-nav-item'}
        onClick={(e) => jump(e, s.id)}
      >
        {s.label}
      </a>
    )
  }

  return (
    <div className="se-site">
      <nav className="se-nav" aria-label="On this page">
        {isRoot && (
          <div className="se-nav-group">
            <span className="se-nav-label is-root">Main admin</span>
            {rootSections.map(link)}
          </div>
        )}
        <div className="se-nav-group">
          <span className="se-nav-label">{isRoot ? 'All admins' : 'On this page'}</span>
          {allSections.map(link)}
        </div>
      </nav>

      <div className="se-sections">
        {isRoot && <AdminsSection />}
        {isRoot && <IdentitySection />}

        {!ready || !info ? (
          <>
            <BlockSkeleton height={220} title />
            <BlockSkeleton height={260} title />
          </>
        ) : (
          <>
            <ResearchSection research={info.research} />
            <GuestsSection guests={info.guests} onChanged={onChanged} />
            <SystemSection system={info.system} guestHours={info.guests.lifetimeHours} />
          </>
        )}

        <YourAccountSection email={email} isRoot={isRoot} onSignOut={onSignOut} />
      </div>
    </div>
  )
}