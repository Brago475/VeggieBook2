import { useEffect } from 'react'
import { BellIcon, ExternalLinkIcon } from '../components/icons/LibraryIcons'
import { LeafDecor } from '../components/layout/LeafDecor'
import { LinkedText } from '../components/notifications/LinkedText'
import { useLang } from '../i18n/languageContext'
import { NOTIFICATIONS } from '../i18n/strings/notifications'
import { useStrings } from '../i18n/useStrings'
import { firstLink, hostOf } from '../utils/messageLinks'
import { dayAndTime, shortDate } from '../utils/notificationDates'
import type { NotificationItem } from '../utils/notificationsApi'

// One notification on its own page: one soft card with the date, the text,
// and a button for its web link, then how long it stays available. Opening
// the page marks this notification opened. The masthead's Back returns to
// the list; a notification that has expired or was taken down shows a note
// and a button back to the list instead.

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

      {loaded && !item && (
        <>
          <p className="message">{t.notFound}</p>
          <button type="button" className="account-btn nf-back" onClick={onBack}>
            {t.backToAll}
          </button>
        </>
      )}

      {item && (
        <>
          <article className="nf-detail">
            <div className="nf-detail-meta">
              <span className="nf-icon is-round" aria-hidden="true">
                <BellIcon />
              </span>
              <span>{dayAndTime(item.sentAt, lang)}</span>
            </div>

            <p className="nf-detail-text">
              <LinkedText text={item.text} linkNote={t.linkNote} onLink={() => onLink(item)} />
            </p>

            {link && (
              <a
                className="nf-open-link"
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onLink(item)}
              >
                {t.openLink(hostOf(link))}
                <ExternalLinkIcon />
                <span className="visually-hidden"> ({t.linkNote})</span>
              </a>
            )}
          </article>

          <p className="nf-detail-until">{t.availableUntil(shortDate(item.expiresAt, lang))}</p>
        </>
      )}
    </div>
  )
}