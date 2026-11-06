import type { AdminNotification } from '../../types/notifications'
import { formatDateTime } from '../../utils/format'
import { NavIcon, type IconName } from '../icons/NavIcons'
import { LinkedText } from './LinkedText'
import { audienceText, hasLink, repeatText, statusLabel } from './notificationFormat'

// One card per notification: status edge and pill, the message, facts as
// chips, and what people did as number boxes. Counts are people.

type Props = {
  items: AdminNotification[]
  onEdit: (item: AdminNotification) => void
  onCopy: (item: AdminNotification) => void
  onStop: (item: AdminNotification) => void
}

function Fact({ icon, text }: { icon: IconName; text: string }) {
  return (
    <span className="nt-fact">
      <NavIcon name={icon} size={15} />
      {text}
    </span>
  )
}

export function NotificationList({ items, onEdit, onCopy, onStop }: Props) {
  return (
    <div className="nt-items">
      {items.map((n) => {
        const active = n.status === 'live' || n.status === 'scheduled'
        const pct = n.counts.shown > 0 ? Math.round((n.counts.opened / n.counts.shown) * 100) : 0

        return (
          <article key={n.id} className={`nt-item is-${n.status}`}>
            <header className="nt-item-top">
              <div className="nt-item-tags">
                <span className={`nt-pill is-${n.status}`}>
                  {n.status === 'live' && <i />}
                  {statusLabel[n.status]}
                </span>
                <span className="nt-item-id">#{n.id}</span>
                {n.templateKey && <span className="nt-tag">Pilot message</span>}
              </div>
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
                  <button type="button" className="nt-btn is-stop" onClick={() => onStop(n)}>
                    Stop
                  </button>
                )}
              </div>
            </header>

            <p className="nt-item-text">
              <LinkedText text={n.bodyEn} />
            </p>

            <div className="nt-facts">
              <Fact icon="clock" text={`${formatDateTime(n.startsAt)} to ${formatDateTime(n.expiresAt)}`} />
              <Fact icon="activity" text={repeatText(n.repeatDays)} />
              <Fact icon="users" text={audienceText(n)} />
              <Fact icon="content" text={n.hasSpanish ? 'English and Spanish' : 'English only'} />
              {n.stoppedAt && <Fact icon="lock" text={`Stopped ${formatDateTime(n.stoppedAt)}`} />}
            </div>

            <div className="nt-numbers">
              <div className="nt-number">
                <strong>{n.counts.shown}</strong>
                <span>Saw it</span>
              </div>
              <div className="nt-number">
                <strong>{n.counts.opened}</strong>
                <span>Opened it{n.counts.shown > 0 ? `, ${pct}%` : ''}</span>
              </div>
              <div className="nt-number">
                <strong>{hasLink(n.bodyEn) ? n.counts.link : '-'}</strong>
                <span>Used the link</span>
              </div>
              <div className="nt-number">
                <strong>{n.counts.dismissed}</strong>
                <span>Closed it</span>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}