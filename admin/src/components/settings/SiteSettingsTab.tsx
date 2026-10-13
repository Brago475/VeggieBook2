import type { SiteSettingsInfo } from '../../types/settings'
import { NavIcon } from '../icons/NavIcons'
import { BlockSkeleton } from '../skeletons/BlockSkeleton'
import { AdminsSection } from './AdminsSection'
import { GuestsSection } from './GuestsSection'
import { IdentitySection } from './IdentitySection'
import { ResearchSection } from './ResearchSection'
import { SystemSection } from './SystemSection'
import { YourAccountSection } from './YourAccountSection'

// Settings, Site settings tab. Admins and Identity records render for the
// root admin only, and their routes refuse everyone else.

type Props = {
  info: SiteSettingsInfo | null
  ready: boolean
  isRoot: boolean
  email: string
  onChanged: () => void
  onSignOut: () => Promise<void>
}

export function SiteSettingsTab({ info, ready, isRoot, email, onChanged, onSignOut }: Props) {
  const sections = [
    ...(isRoot
      ? [
          { id: 'admins', label: 'Admins', root: true },
          { id: 'identity', label: 'Identity records', root: true },
        ]
      : []),
    { id: 'research', label: 'Research', root: false },
    { id: 'guests', label: 'Guests', root: false },
    { id: 'system', label: 'System', root: false },
    { id: 'account', label: 'Your account', root: false },
  ]

  return (
    <div className="se-site">
      <nav className="se-toc" aria-label="On this page">
        <span className="se-toc-title">On this page</span>
        {sections.map((s) => (
          <a key={s.id} href={`#settings-${s.id}`} onClick={(e) => jump(e, s.id)}>
            {s.label}
            {s.root && <NavIcon name="lock" size={13} />}
          </a>
        ))}
        {isRoot && (
          <span className="se-toc-key">
            <NavIcon name="lock" size={12} />
            Main admin only
          </span>
        )}
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

// Scrolls to a section without changing the page hash the admin site uses
// for its tabs.
function jump(e: React.MouseEvent, id: string) {
  e.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}