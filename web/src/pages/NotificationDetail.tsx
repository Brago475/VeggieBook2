import { useEffect } from 'react'
import { BellIcon } from '../components/icons/LibraryIcons'
import { LeafDecor } from '../components/layout/LeafDecor'
import { LinkCard } from '../components/notifications/LinkCard'
import { LinkedText } from '../components/notifications/LinkedText'
import { useLang } from '../i18n/languageContext'
import { NOTIFICATIONS } from '../i18n/strings/notifications'
import { useStrings } from '../i18n/useStrings'
import { firstLink } from '../utils/messageLinks'
import { longDate, timeOf, weekdayDate } from '../utils/notificationDates'
import type { NotificationItem } from '../utils/notificationsApi'

// One notification on its own page: when it was sent, the text, a card for
// its web link, and how long it stays available. Opening the page marks
// this notification opened. A notification that has expired or was taken
// down shows a short note instead.

type Props = {
  items: NotificationItem[]
  loaded: boolean
  // The notification's id, from the address.
  focusId: string
  onOpen: (item: NotificationItem) => void
  onLink: (item: NotificationItem) => void
  onBack: () => void
}

export function NotificationDetail({ items, loaded, focusId, onOpen, onLink, onBack }: Props) {
  const t = useStrings(NOTIFICATIONS)
  const { lang } = useLang()

  // The newest round of this notification, when it repeats.
  const item = items.find((i) => String(i.id) === focusId) ?? null

  useEffect(() => {
    if (item && !item.read) onOpen(item)
  }, [item, onOpen])

  const link = item ? firstLink(item.text) : null

  return (
    <div className="account-screen nf-screen">
      <LeafDecor className="account-leaf" />

      {!loaded && (
        <div role="status" aria-busy="true">
          <span className="visually-hidden">{t.loading}</span>
          <div className="skeleton nf-skel-detail" aria-hidden="true" />
        </div>
      )}

      {loaded && !item && <p className="message">{t.notFound}</p>}

      {item && (
        <article className="nf-detail">
          <header className="nf-detail-head">
            <span className="nf-icon is-large" aria-hidden="true">
              <BellIcon />
            </span>
            <div>
              <h1 className="nf-detail-kicker">{t.kicker}</h1>
              <p className="nf-detail-date">
                {t.sentAt(weekdayDate(item.sentAt, lang), timeOf(item.sentAt, lang))}
              </p>
            </div>
          </header>

          <p className="nf-detail-text">
            <LinkedText text={item.text} linkNote={t.linkNote} onLink={() => onLink(item)} />
          </p>

          {link && <LinkCard href={link} onClick={() => onLink(item)} />}

          <p className="nf-detail-foot">{t.availableUntil(longDate(item.expiresAt, lang))}</p>
        </article>
      )}

      {loaded && (
        <button type="button" className="account-btn nf-back" onClick={onBack}>
          {t.backToAll}
        </button>
      )}
    </div>
  )
}