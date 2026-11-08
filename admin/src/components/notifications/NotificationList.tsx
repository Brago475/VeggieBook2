import { useNow } from '../../hooks/useNow'
import type { AdminNotification } from '../../types/notifications'
import { spanText } from '../../utils/calendarDates'
import { formatDateTime } from '../../utils/format'
import { NavIcon, type IconName } from '../icons/NavIcons'
import { LinkedText } from './LinkedText'
import { audienceText, hasLink, repeatText, statusLabel } from './notificationFormat'
import '../../styles/notification-schedule.css'
import '../../styles/notification-names.css'

// One compact card per notification: status and actions, the title and the
// message as labeled rows, a live countdown, then Details, which opens to
// the dates, audience, language and the four counts. The closed Details row
// still shows the counts in one line. Counts are people.

type Props = {
  items: AdminNotification[]
  onEdit: (item: AdminNotification) => void
  onCopy: (item: AdminNotification) => void
  onRename: (item: AdminNotification) => void
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

// Live: time left and how much of the run has passed. Scheduled: time
// until it starts.
function Countdown({ item, now }: { item: AdminNotification; now: Date }) {
  const start = new Date(item.startsAt).getTime()
  const end = new Date(item.expiresAt).getTime()
  const t = now.getTime()

  if (item.status === 'live') {
    const pct = Math.min(100, Math.max(0, ((t - start) / (end - start)) * 100))
    return (
      <div className="nt-timeline">
        <div className="nt-timeline-text">
          <span>Started {formatDateTime(item.startsAt)}</span>
          <strong>Ends in {spanText(end - t)}</strong>
        </div>
        <div
          className="nt-bar"
          role="progressbar"
          aria-label="Time passed"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
        >
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  }

  if (item.status === 'scheduled') {
    return (
      <div className="nt-timeline is-scheduled">
        <div className="nt-timeline-text">
          <strong>{start > t ? `Starts in ${spanText(start - t)}` : 'Starting now'}</strong>
          <span>{formatDateTime(item.startsAt)}</span>
        </div>
      </div>
    )
  }

  return null
}

// "2 saw, 1 opened, 1 used the link, 1 closed"
function countsLine(n: AdminNotification): string {
  const parts = [`${n.counts.shown} saw`, `${n.counts.opened} opened`]
  if (hasLink(n.bodyEn)) parts.push(`${n.counts.link} used the link`)
  parts.push(`${n.counts.dismissed} closed`)
  return parts.join(', ')
}

export function NotificationList({ items, onEdit, onCopy, onRename, onStop }: Props) {
  const now = useNow(30_000)

  return (
    <div className="nt-items">
      {items.map((n) => {
        const active = n.status === 'live' || n.status === 'scheduled'
        const pct = n.counts.shown > 0 ? Math.round((n.counts.opened / n.counts.shown) * 100) : 0

        return (
          <article key={n.id} className={`nt-item nt-card is-${n.status}`}>
            <header className="nt-item-top">
              <div className="nt-item-tags">
                <span className={`nt-pill is-${n.status}`}>
                  {n.status === 'live' && <i />}
                  {statusLabel[n.status]}
                </span>
                {n.templateKey && <span className="nt-tag">Template</span>}
              </div>
              <div className="nt-actions">
                {n.status !== 'stopped' && (
                  <button type="button" className="nt-btn" onClick={() => onEdit(n)}>
                    Edit
                  </button>
                )}
                <button type="button" className="nt-btn" onClick={() => onRename(n)}>
                  {n.title ? 'Rename' : 'Add title'}
                </button>
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

            <dl className="nt-card-fields">
              <dt>Title</dt>
              <dd className={n.title ? 'nt-card-title' : 'nt-card-title is-empty'}>
                {n.title ?? (
                  <>
                    No title
                    <button type="button" className="nt-name-add" onClick={() => onRename(n)}>
                      Add a title
                    </button>
                  </>
                )}
              </dd>
              <dt>Message</dt>
              <dd className="nt-card-body">
                <LinkedText text={n.bodyEn} />
              </dd>
            </dl>

            <Countdown item={n} now={now} />

            <details className="nt-more">
              <summary>
                <span className="nt-more-label">Details</span>
                <span className="nt-more-counts">{countsLine(n)}</span>
              </summary>

              <div className="nt-more-body">
                <div className="nt-facts">
                  <Fact icon="clock" text={`${formatDateTime(n.startsAt)} to ${formatDateTime(n.expiresAt)}`} />
                  <Fact icon="activity" text={repeatText(n.repeatDays)} />
                  <Fact icon="users" text={audienceText(n)} />
                  <Fact icon="content" text={n.hasSpanish ? 'English and Spanish' : 'English only'} />
                  {n.stoppedAt && <Fact icon="lock" text={`Stopped ${formatDateTime(n.stoppedAt)}`} />}
                  <Fact icon="content" text={`Number ${n.id}`} />
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
              </div>
            </details>
          </article>
        )
      })}
    </div>
  )
}