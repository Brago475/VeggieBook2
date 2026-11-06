import { useEffect, useRef, useState } from 'react'
import { LeafIcon } from '../components/icons/LibraryIcons'
import { LeafDecor } from '../components/layout/LeafDecor'
import { LinkCard } from '../components/notifications/LinkCard'
import { LinkedText } from '../components/notifications/LinkedText'
import { notificationKey } from '../hooks/useNotifications'
import { useLang } from '../i18n/languageContext'
import { NOTIFICATIONS } from '../i18n/strings/notifications'
import { useStrings } from '../i18n/useStrings'
import { firstLink } from '../utils/messageLinks'
import { isToday, sameDay, shortDate, timeOf } from '../utils/notificationDates'
import type { NotificationItem } from '../utils/notificationsApi'

// Every live message as one chat-style thread, oldest at the top, opened
// at the message that was tapped. Opening the thread marks every unread
// message opened. Messages that were unread on arrival keep a green tint
// until the screen is left.

type Props = {
  items: NotificationItem[]
  loaded: boolean
  error: string | null
  // The message that was tapped, from the address.
  focusId: string | null
  onOpenAll: () => void
  onLink: (item: NotificationItem) => void
}

export function NotificationThread({ items, loaded, error, focusId, onOpenAll, onLink }: Props) {
  const t = useStrings(NOTIFICATIONS)
  const { lang } = useLang()
  const [fresh, setFresh] = useState<Set<string>>(() => new Set())
  const focusRef = useRef<HTMLLIElement>(null)
  const scrolled = useRef(false)

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

  const ordered = [...items].reverse()
  const focusKey =
    focusId === null
      ? null
      : ([...ordered].reverse().find((item) => String(item.id) === focusId) ?? null)
  const focusItemKey = focusKey ? notificationKey(focusKey) : null

  useEffect(() => {
    if (scrolled.current || !focusRef.current) return
    scrolled.current = true
    focusRef.current.scrollIntoView({ block: 'center' })
  }, [ordered.length])

  return (
    <div className="account-screen nf-screen">
      <LeafDecor className="account-leaf" />

      <div className="nf-thread-head">
        <span className="nf-avatar is-large" aria-hidden="true">
          <LeafIcon />
        </span>
        <div>
          <h1 className="nf-thread-title">{t.sender}</h1>
          <p className="nf-thread-sub">{t.threadCount(items.length)}</p>
        </div>
      </div>

      {!loaded && (
        <div role="status" aria-busy="true">
          <span className="visually-hidden">{t.loading}</span>
          <div className="skeleton nf-skel-bubble" aria-hidden="true" />
          <div className="skeleton nf-skel-bubble is-short" aria-hidden="true" />
        </div>
      )}

      {loaded && error && items.length === 0 && <p className="message">{t.couldNotLoad}</p>}
      {loaded && !error && items.length === 0 && <p className="message">{t.emptyAll}</p>}

      <ol className="nf-thread">
        {ordered.map((item, i) => {
          const key = notificationKey(item)
          const showDay = i === 0 || !sameDay(ordered[i - 1].sentAt, item.sentAt)
          const today = isToday(item.sentAt)
          const link = firstLink(item.text)
          const classes = ['nf-bubble']
          if (fresh.has(key)) classes.push('is-fresh')
          if (key === focusItemKey) classes.push('is-focus')

          return (
            <li key={key} className="nf-thread-item" ref={key === focusItemKey ? focusRef : undefined}>
              {showDay && (
                <p className={today ? 'nf-day is-today' : 'nf-day'}>
                  {today ? t.today : shortDate(item.sentAt, lang)}
                </p>
              )}
              <div className={classes.join(' ')}>
                <p className="nf-bubble-text">
                  <LinkedText text={item.text} linkNote={t.linkNote} onLink={() => onLink(item)} />
                </p>
                {link && <LinkCard href={link} onClick={() => onLink(item)} />}
              </div>
              <p className="nf-bubble-meta">
                {timeOf(item.sentAt, lang)}, {t.availableUntil(shortDate(item.expiresAt, lang))}
              </p>
            </li>
          )
        })}
      </ol>

      {items.length > 0 && <p className="nf-note is-center">{t.noReplies}</p>}
    </div>
  )
}