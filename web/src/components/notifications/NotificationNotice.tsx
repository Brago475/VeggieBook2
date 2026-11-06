import { useEffect, useRef, useState } from 'react'
import { useLang } from '../../i18n/languageContext'
import { COMMON } from '../../i18n/strings/common'
import { NOTIFICATIONS } from '../../i18n/strings/notifications'
import { useStrings } from '../../i18n/useStrings'
import { listTime } from '../../utils/notificationDates'
import type { NotificationItem } from '../../utils/notificationsApi'
import { BellIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons/LibraryIcons'
import { notificationKey } from '../../hooks/useNotifications'
import { LinkedText } from './LinkedText'

// The pop-up for new messages. The newest shows as a chat bubble, with
// arrows to step through the others, and the rest wait below in an
// email-style list. Built on the confirm dialog's styles (dialog.css); on
// a phone it sits at the bottom of the screen.
//
// See all messages opens the inbox, a waiting message opens its thread,
// and Close, a tap outside, or Escape closes it.

const MAX_WAITING = 2

type Props = {
  items: NotificationItem[]
  onSeeAll: () => void
  onOpen: (item: NotificationItem) => void
  onClose: () => void
  onLink: (item: NotificationItem) => void
}

export function NotificationNotice({ items, onSeeAll, onOpen, onClose, onLink }: Props) {
  const t = useStrings(NOTIFICATIONS)
  const common = useStrings(COMMON)
  const { lang } = useLang()
  const [index, setIndex] = useState(0)
  const seeAllRef = useRef<HTMLButtonElement>(null)

  const position = Math.min(index, items.length - 1)
  const item = items[position]
  const others = items.filter((_, i) => i !== position)
  const waiting = others.slice(0, MAX_WAITING)
  const extra = others.length - waiting.length
  const many = items.length > 1

  useEffect(() => {
    seeAllRef.current?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  if (!item) return null

  return (
    <div className="dialog-overlay nf-overlay" onClick={onClose}>
      <div
        className="dialog nf-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nf-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="nf-sheet-head">
          <span className="nf-sheet-icon" aria-hidden="true">
            <BellIcon />
          </span>
          <div className="nf-sheet-heading">
            <h2 className="nf-sheet-title" id="nf-sheet-title">
              {t.newMessages(items.length)}
            </h2>
            {many && <p className="nf-sheet-step">{t.messageOf(position + 1, items.length)}</p>}
          </div>
          {many && (
            <div className="nf-steppers">
              <button
                type="button"
                className="nf-step"
                aria-label={t.previous}
                disabled={position === 0}
                onClick={() => setIndex(position - 1)}
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                className="nf-step"
                aria-label={t.next}
                disabled={position === items.length - 1}
                onClick={() => setIndex(position + 1)}
              >
                <ChevronRightIcon />
              </button>
            </div>
          )}
        </div>

        <div className="nf-sheet-message" aria-live="polite">
          <div className="nf-bubble-top">
            <span className="nf-sender">{t.sender}</span>
            <span className="nf-time">{listTime(item.sentAt, lang)}</span>
          </div>
          <p className="nf-bubble nf-bubble-text is-fresh">
            <LinkedText text={item.text} linkNote={t.linkNote} onLink={() => onLink(item)} />
          </p>
          {many && (
            <div className="nf-dots" aria-hidden="true">
              {items.map((m, i) => (
                <span key={notificationKey(m)} className={i === position ? 'nf-dot is-on' : 'nf-dot'} />
              ))}
            </div>
          )}
        </div>

        {waiting.length > 0 && (
          <div className="nf-waiting">
            <p className="nf-waiting-label">{t.alsoWaiting}</p>
            <ul>
              {waiting.map((other) => (
                <li key={notificationKey(other)}>
                  <button type="button" className="nf-waiting-row" onClick={() => onOpen(other)}>
                    <span className="nf-unread-dot" aria-hidden="true" />
                    <span className="nf-waiting-text">
                      <span className="nf-waiting-preview">{other.text}</span>
                      <span className="nf-waiting-time">{listTime(other.sentAt, lang)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {extra > 0 && <p className="nf-waiting-more">{t.andMore(extra)}</p>}
          </div>
        )}

        <div className="dialog-actions">
          <button ref={seeAllRef} type="button" className="create-btn" onClick={onSeeAll}>
            {t.seeAll}
          </button>
          <button type="button" className="account-btn" onClick={onClose}>
            {common.close}
          </button>
        </div>
      </div>
    </div>
  )
}