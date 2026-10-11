import type { ParticipantsResponse, TrackingStatus } from '../../types/participants'
import { statusLabel } from './participantText'

// The tabs over the people cards: All, then one per tracking status, each
// with its count.

export type StatusFilter = 'all' | TrackingStatus

type Props = {
  counts: ParticipantsResponse['counts']
  value: StatusFilter
  onChange: (value: StatusFilter) => void
}

export function StatusTabs({ counts, value, onChange }: Props) {
  const tabs: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'on', label: statusLabel.on, count: counts.on },
    { id: 'off_self', label: statusLabel.off_self, count: counts.offSelf },
    { id: 'off_admin', label: statusLabel.off_admin, count: counts.offAdmin },
  ]

  return (
    <div className="pt-tabs" role="tablist" aria-label="Tracking">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === value}
          className={t.id === value ? `pt-tab is-active is-${t.id}` : `pt-tab is-${t.id}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          <span className="pt-tab-count">{t.count.toLocaleString()}</span>
        </button>
      ))}
    </div>
  )
}