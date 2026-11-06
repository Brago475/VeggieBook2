import type { AdminNotification } from '../../types/notifications'
import { formatDateTime } from '../../utils/format'
import { LinkedText } from './LinkedText'
import { audienceText, hasLink, repeatText, statusClass, statusLabel } from './notificationFormat'

// Notifications as one table, in the shared data-table style. Counts are
// people, not clicks; "-" when the message has no link.

type Props = {
  items: AdminNotification[]
  onEdit: (item: AdminNotification) => void
  onCopy: (item: AdminNotification) => void
  onStop: (item: AdminNotification) => void
}

export function NotificationTable({ items, onEdit, onCopy, onStop }: Props) {
  return (
    <div className="table-wrap nt-table-wrap">
      <table className="data-table nt-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Message</th>
            <th>When</th>
            <th>Who</th>
            <th className="num">Saw</th>
            <th className="num">Opened</th>
            <th className="num">Link</th>
            <th className="num">Closed</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {items.map((n) => {
            const active = n.status === 'live' || n.status === 'scheduled'
            return (
              <tr key={n.id}>
                <td>
                  <span className={`status ${statusClass(n.status)}`}>{statusLabel[n.status]}</span>
                  <span className="nt-meta">#{n.id}</span>
                </td>
                <td className="nt-msg">
                  <span className="nt-msg-text">
                    <LinkedText text={n.bodyEn} />
                  </span>
                  <span className="nt-meta">
                    {n.templateKey ? 'Pilot message, ' : ''}
                    {n.hasSpanish ? 'English and Spanish' : 'English only'}
                  </span>
                </td>
                <td className="nt-when">
                  <span>{formatDateTime(n.startsAt)}</span>
                  <span className="nt-meta">to {formatDateTime(n.expiresAt)}</span>
                  <span className="nt-meta">{repeatText(n.repeatDays)}</span>
                  {n.stoppedAt && <span className="nt-meta">Stopped {formatDateTime(n.stoppedAt)}</span>}
                </td>
                <td>{audienceText(n)}</td>
                <td className="num strong">{n.counts.shown}</td>
                <td className="num">{n.counts.opened}</td>
                <td className="num">{hasLink(n.bodyEn) ? n.counts.link : '-'}</td>
                <td className="num">{n.counts.dismissed}</td>
                <td>
                  <div className="nt-actions">
                    {n.status !== 'stopped' && (
                      <button type="button" className="nt-btn" onClick={() => onEdit(n)}>
                        Edit
                      </button>
                    )}
                    <button type="button" className="nt-btn" onClick={() => onCopy(n)}>
                      Send again
                    </button>
                    {active && (
                      <button type="button" className="nt-btn is-quiet-warn" onClick={() => onStop(n)}>
                        Stop
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}