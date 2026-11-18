import { useState } from 'react'
import { LeafDecor } from '../components/layout/LeafDecor'
import { GhostEmpty } from '../components/notifications/GhostEmpty'
import { InboxRow } from '../components/notifications/InboxRow'
import { CardListSkeleton } from '../components/notifications/NotificationSkeletons'
import { SectionSwitch } from '../components/notifications/SectionSwitch'
import { useHeld } from '../hooks/useHeld'
import { notificationKey } from '../hooks/useNotifications'
import { NOTIFICATIONS } from '../i18n/strings/notifications'
import { useStrings } from '../i18n/useStrings'
import { isToday } from '../utils/notificationDates'
import type { NotificationItem } from '../utils/notificationsApi'

// The Notifications list: every live notification, newest first, as small
// pages grouped under Today and Earlier, with All and Unread tabs. A page
// opens that notification's own page. The list alone does not mark
// anything opened. The switch on top leads to the Playlists tab. The list
// ends with a short closing card. While loading, card outlines show for at
// least the usual short minimum. With no notifications at all, faded rows
// show in place of the list.

type Props = {
  items: NotificationItem[]
  loaded: boolean
  error: string | null
  onOpen: (item: NotificationItem) => void
  onPlaylists: () => void
}

const SKELETON_CARDS = 3

export function Notifications({ items, loaded, error, onOpen, onPlaylists }: Props) {
  const t = useStrings(NOTIFICATIONS)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const showSkeleton = useHeld(!loaded)

  const unread = items.filter((item) => !item.read)
  const list = unreadOnly ? unread : items
  const today = list.filter((item) => isToday(item.sentAt))
  const earlier = list.filter((item) => !isToday(item.sentAt))
  const isEmpty = !showSkeleton && !error && items.length === 0

  function group(id: string, label: string, cards: NotificationItem[]) {
    if (cards.length === 0) return null
    return (
      <div className="nf-day" role="group" aria-labelledby={id}>
        <div className="nf-day-head">
          <h2 className="nf-day-title" id={id}>
            {label}
          </h2>
          <span className="nf-day-rule" aria-hidden="true" />
        </div>
        <ul className="nf-pages">
          {cards.map((item) => (
            <li key={notificationKey(item)}>
              <InboxRow item={item} onOpen={() => onOpen(item)} />
            </li>
          ))}
        </ul>
      </div>
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

      <SectionSwitch active="messages" onMessages={() => {}} onPlaylists={onPlaylists} />

      {!isEmpty && (
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
      )}

      {showSkeleton && <CardListSkeleton label={t.loading} kind="message" count={SKELETON_CARDS} />}

      {isEmpty && <GhostEmpty kind="message" title={t.emptyTitle} body={t.emptyAll} />}

      {!showSkeleton && !isEmpty && (
        <>
          {error && items.length === 0 && <p className="message">{t.couldNotLoad}</p>}
          {!error && items.length > 0 && list.length === 0 && (
            <p className="nf-empty-line">{t.emptyUnread}</p>
          )}

          {group('nf-day-today', t.today, today)}
          {group('nf-day-earlier', t.earlier, earlier)}

          {items.length > 0 && (
            <div className="nf-chapter-end">
              <span className="nf-chapter-spine" aria-hidden="true" />
              <p className="nf-chapter-text">
                {t.chapterEnd} {t.expireNote}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}