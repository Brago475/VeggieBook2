import type { AdminNotification } from '../../types/notifications'
import { formatDateTime } from '../../utils/format'
import { LinkedText } from './LinkedText'
import { audienceText, hasLink, repeatText, statusClass, statusLabel } from './notificationFormat'

// One notification: status, text, when, who, and what people did with it.
// Counts are people, not clicks.

type Props = {
  item: AdminNotification
  onEdit: (item: AdminNotification) => void
  onCopy: (item: AdminNotification) => void
  onStop: (item: AdminNotification) => void
}

export function NotificationCard({ item, onEdit, onCopy, onStop }: Props) {
  const active = item.status === 'live' || item.status === 'scheduled'
  const showLink = hasLink(item.bodyEn)

  return (
    <article className="card nt-card">
      <header className="nt-card-head">
        <span className={`status ${statusClass(item.status)}`}>{statusLabel[item.status]}</span>
        <span className="nt-card-id">#{item.id}</span>
        {item.templateKey && <span className="nt-tag">Pilot message</span>}
      </header>

      <p className="nt-card-body">
        <LinkedText text={item.bodyEn} />
      </p>

      <dl className="nt-facts">
        <div>
          <dt>When</dt>
          <dd>
            {formatDateTime(item.startsAt)} to {formatDateTime(item.expiresAt)}
          </dd>
        </div>
        <div>
          <dt>Repeat</dt>
          <dd>{repeatText(item.repeatDays)}</dd>
        </div>
        <div>
          <dt>Who</dt>
          <dd>{audienceText(item)}</dd>
        </div>
        <div>
          <dt>Language</dt>
          <dd>{item.hasSpanish ? 'English and Spanish' : 'English only'}</dd>
        </div>
        {item.stoppedAt && (
          <div>
            <dt>Stopped</dt>
            <dd>{formatDateTime(item.stoppedAt)}</dd>
          </div>
        )}
      </dl>

      <ul className="nt-counts" aria-label="What people did">
        <li>
          <span className="nt-count">{item.counts.shown}</span> saw it
        </li>
        <li>
          <span className="nt-count">{item.counts.opened}</span> opened it
        </li>
        {showLink && (
          <li>
            <span className="nt-count">{item.counts.link}</span> used the link
          </li>
        )}
        <li>
          <span className="nt-count">{item.counts.dismissed}</span> closed it
        </li>
      </ul>

      <footer className="nt-card-actions">
        {item.status !== 'stopped' && (
          <button type="button" className="button-secondary" onClick={() => onEdit(item)}>
            Edit
          </button>
        )}
        <button type="button" className="button-secondary" onClick={() => onCopy(item)}>
          Send again
        </button>
        {active && (
          <button type="button" className="button-danger" onClick={() => onStop(item)}>
            Stop
          </button>
        )}
      </footer>
    </article>
  )
}