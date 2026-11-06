import type { AdminNotification } from '../../types/notifications'
import { formatDate } from '../../utils/format'
import { NavIcon, type IconName } from '../icons/NavIcons'

// The four numbers at the top of the Notifications page, in the same card
// style as All Data and Books: icon square, label, pill, number, note.
// Seen and opened are people per message, added across all messages.

type PillTone = 'green' | 'blue' | 'gray'

type Stat = {
  label: string
  value: number
  note: string
  icon: IconName
  pill: string
  pillTone: PillTone
}

export function NotificationStats({ list }: { list: AdminNotification[] }) {
  const live = list.filter((n) => n.status === 'live').length
  const upcoming = list
    .filter((n) => n.status === 'scheduled')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const seen = list.reduce((sum, n) => sum + n.counts.shown, 0)
  const opened = list.reduce((sum, n) => sum + n.counts.opened, 0)
  const openedPct = seen > 0 ? Math.round((opened / seen) * 100) : 0

  const stats: Stat[] = [
    {
      label: 'Live now',
      value: live,
      note: 'Showing in the app right now',
      icon: 'bell',
      pill: live > 0 ? 'Showing' : 'None',
      pillTone: live > 0 ? 'green' : 'gray',
    },
    {
      label: 'Scheduled',
      value: upcoming.length,
      note: 'Waiting for their start time',
      icon: 'clock',
      pill: upcoming.length > 0 ? `Next ${formatDate(upcoming[0].startsAt)}` : 'None',
      pillTone: upcoming.length > 0 ? 'blue' : 'gray',
    },
    {
      label: 'Seen',
      value: seen,
      note: 'Times a person saw a pop-up',
      icon: 'users',
      pill: 'All messages',
      pillTone: 'gray',
    },
    {
      label: 'Opened',
      value: opened,
      note: 'Opened from the pop-up or the menu',
      icon: 'answers',
      pill: `${openedPct}% of seen`,
      pillTone: openedPct > 0 ? 'green' : 'gray',
    },
  ]

  return (
    <div className="nt-stats">
      {stats.map((s) => (
        <div key={s.label} className="nt-stat">
          <div className="nt-stat-head">
            <span className="nt-stat-icon">
              <NavIcon name={s.icon} size={20} />
            </span>
            <span className="nt-stat-label">{s.label}</span>
            <span className={`nt-stat-pill is-${s.pillTone}`}>{s.pill}</span>
          </div>
          <span className="nt-stat-value">{s.value.toLocaleString()}</span>
          <span className="nt-stat-note">{s.note}</span>
        </div>
      ))}
    </div>
  )
}