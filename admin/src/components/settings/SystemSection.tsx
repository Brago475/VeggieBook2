import type { SiteSettingsInfo } from '../../types/settings'
import { formatDateTime } from '../../utils/format'
import { studyTitle } from '../studies/studyFormat'
import { SettingsCard } from './SettingsCard'

// Health of the app, checked when Settings opens.

type Props = {
  system: SiteSettingsInfo['system']
  guestHours: number
}

export function SystemSection({ system, guestHours }: Props) {
  const checks = [
    { name: 'API', ok: true, text: 'Online' },
    { name: 'Database', ok: system.database, text: system.database ? 'Online' : 'Not reachable' },
    { name: 'Study', ok: true, text: system.study ? studyTitle(system.study) : 'None running' },
  ]

  return (
    <SettingsCard id="system" title="System" aside={<span className="se-muted se-small">Checked when this page opens</span>}>
      <div className="se-health">
        {checks.map((c) => (
          <div key={c.name}>
            <span>{c.name}</span>
            <strong>
              <span className={c.ok ? 'se-dot is-ok' : 'se-dot is-warn'} aria-hidden="true" />
              {c.text}
            </strong>
          </div>
        ))}
      </div>
      <dl className="se-list">
        <div>
          <dt>Guests removed after</dt>
          <dd>{guestHours} hours</dd>
        </div>
        <div>
          <dt>Last book saved</dt>
          <dd>{system.lastBookAt ? formatDateTime(system.lastBookAt) : 'None yet'}</dd>
        </div>
      </dl>
    </SettingsCard>
  )
}