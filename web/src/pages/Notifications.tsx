import { useState } from 'react'
import { LeafDecor } from '../components/layout/LeafDecor'
import { InboxRow } from '../components/notifications/InboxRow'
import { notificationKey } from '../hooks/useNotifications'
import { NOTIFICATIONS } from '../i18n/strings/notifications'
import { useStrings } from '../i18n/useStrings'
import { isToday } from '../utils/notificationDates'
import type { NotificationItem } from '../utils/notificationsApi'

// The Notifications inbox: every live message, newest first, grouped into
// Today and Earlier, with All and Unread tabs. A row opens the thread at
// that message. Visiting the inbox alone does not mark anything opened.

type Props = {
  items: NotificationItem[]
  loaded: boolean
  error: string | null
  onOpen: (item: NotificationItem) => void
}

const SKELETON_ROWS = 3

export function Notifications({ items, loaded, error, onOpen }: Props) {
  const t = useStrings(NOTIFICATIONS)
  const [unreadOnly, setUnreadOnly] = useState(false)

  const unread = items.filter((item) => !item.read)
  const list = unreadOnly ? unread : items
  const today = list.filter((item) => isToday(item.sentAt))
  const earlier = list.filter((item) => !isToday(item.sentAt))

  function group(label: string, rows: NotificationItem[]) {
    if (rows.length === 0) return null
    return (
      <section>
        <h2 className="nf-group-label">{label}</h2>
        <ul className="nf-group">
          {rows.map((item) => (
            <li key={notificationKey(item)}>
              <InboxRow item={item} onOpen={() => onOpen(item)} />
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <div className="account-screen nf-screen">
      <LeafDecor className="account-leaf" />

      <div className="library-head">
        <div className="library-head-text">
          <h1 className="library-title">{t.title}</h1>
          <p className="library-sub">{t.sub}</p>
        </div>
      </div>

      <div className="nf-tabs" role="tablist" aria-label={t.show}>
        <button
          type="button"
          role="tab"
          aria-selected={!unreadOnly}
          className="nf-tab"
          onClick={() => setUnreadOnly(false)}
        >
          {t.tabAll(items.length)}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={unreadOnly}
          className="nf-tab"
          onClick={() => setUnreadOnly(true)}
        >
          {t.tabUnread(unread.length)}
        </button>
      </div>

      {!loaded && (
        <div role="status" aria-busy="true">
          <span className="visually-hidden">{t.loading}</span>
          <ul className="nf-group" aria-hidden="true">
            {Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <li key={i} className="nf-skel-row">
                <span className="skeleton nf-skel-avatar" />
                <span className="nf-skel-lines">
                  <span className="skeleton nf-skel-line" />
                  <span className="skeleton nf-skel-line is-short" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loaded && error && items.length === 0 && <p className="message">{t.couldNotLoad}</p>}
      {loaded && !error && list.length === 0 && (
        <p className="message">{unreadOnly ? t.emptyUnread : t.emptyAll}</p>
      )}

      {group(t.today, today)}
      {group(t.earlier, earlier)}

      {items.length > 0 && <p className="nf-note">{t.expireNote}</p>}
    </div>
  )
}