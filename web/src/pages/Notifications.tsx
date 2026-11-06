import { useEffect, useState } from 'react'
import { LeafDecor } from '../components/layout/LeafDecor'
import { LinkedText } from '../components/notifications/LinkedText'
import { notificationKey } from '../hooks/useNotifications'
import { useLang } from '../i18n/languageContext'
import { NOTIFICATIONS } from '../i18n/strings/notifications'
import { useStrings } from '../i18n/useStrings'
import type { NotificationItem } from '../utils/notificationsApi'

// The Notifications screen: every live message for this account or guest,
// newest first. Opening the screen marks unread messages as opened. They
// keep the New tag until the screen is left, so it is clear which ones
// arrived since the last visit.

type Props = {
  items: NotificationItem[]
  loaded: boolean
  error: string | null
  onOpenAll: () => void
  onLink: (item: NotificationItem) => void
}

const SKELETON_CARDS = 2

export function Notifications({ items, loaded, error, onOpenAll, onLink }: Props) {
  const t = useStrings(NOTIFICATIONS)
  const { lang } = useLang()
  const [fresh, setFresh] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    const unread = items.filter((item) => !item.read)
    if (unread.length === 0) return
    setFresh((prev) => {
      const next = new Set(prev)
      for (const item of unread) next.add(notificationKey(item))
      return next
    })
    onOpenAll()
  }, [items, onOpenAll])

  const locale = lang === 'es' ? 'es-US' : 'en-US'
  function sentOn(iso: string) {
    return new Date(iso).toLocaleDateString(locale, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
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

      {!loaded && (
        <div role="status" aria-busy="true">
          <span className="visually-hidden">{t.loading}</span>
          <ul className="nf-list" aria-hidden="true">
            {Array.from({ length: SKELETON_CARDS }, (_, i) => (
              <li key={i}>
                <div className="skeleton nf-skel" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {loaded && error && items.length === 0 && <p className="message">{t.couldNotLoad}</p>}
      {loaded && !error && items.length === 0 && <p className="message">{t.empty}</p>}

      {items.length > 0 && (
        <ul className="nf-list">
          {items.map((item) => {
            const key = notificationKey(item)
            const isNew = fresh.has(key)
            return (
              <li key={key} className={isNew ? 'account-card nf-card is-new' : 'account-card nf-card'}>
                <div className="nf-meta">
                  {isNew && <span className="nf-tag">{t.newLabel}</span>}
                  <span>{t.sent(sentOn(item.sentAt))}</span>
                </div>
                <p className="nf-text">
                  <LinkedText text={item.text} linkNote={t.linkNote} onLink={() => onLink(item)} />
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}