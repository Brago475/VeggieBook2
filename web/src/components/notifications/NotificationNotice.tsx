import { useEffect, useRef, useState } from 'react'
import { useLang } from '../../i18n/languageContext'
import { COMMON } from '../../i18n/strings/common'
import { NOTIFICATIONS } from '../../i18n/strings/notifications'
import { useStrings } from '../../i18n/useStrings'
import { listTime } from '../../utils/notificationDates'
import type { NotificationItem } from '../../utils/notificationsApi'
import { BellIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons/LibraryIcons'

// The pop-up for new notifications: a title row with arrows when there is
// more than one, one card for the current notification, and Close and See
// all. Tapping the card opens that notification on its own page, where its
// link is. Built on the confirm dialog's styles (dialog.css); on a phone it
// sits at the bottom of the screen. Close, a tap outside, or Escape closes it.

type Props = {
  items: NotificationItem[]
  onSeeAll: () => void
  onOpen: (item: NotificationItem) => void
  onClose: () => void
}

export function NotificationNotice({ items, onSeeAll, onOpen, onClose }: Props) {
  const t = useStrings(NOTIFICATIONS)
  const common = useStrings(COMMON)
  const { lang } = useLang()
  const [index, setIndex] = useState(0)
  const cardRef = useRef<HTMLButtonElement>(null)

  const position = Math.min(index, items.length - 1)
  const item = items[position]
  const many = items.length > 1

  useEffect(() => {
    cardRef.current?.focus()

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
          <span className="nf-icon is-small" aria-hidden="true">
            <BellIcon />
          </span>
          <h2 className="nf-sheet-title" id="nf-sheet-title">
            {t.newTitle(items.length)}
          </h2>
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
              <span className="nf-step-count" aria-live="polite">
                {t.stepOf(position + 1, items.length)}
              </span>
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

        <button ref={cardRef} type="button" className="nf-sheet-card" onClick={() => onOpen(item)}>
          <span className="nf-sheet-text">{item.text}</span>
          <span className="nf-sheet-foot">
            <span className="nf-sheet-time">{listTime(item.sentAt, lang)}</span>
            <span className="nf-sheet-more">
              {t.readMore}
              <ChevronRightIcon />
            </span>
          </span>
        </button>

        <div className="nf-sheet-actions">
          <button type="button" className="account-btn" onClick={onClose}>
            {common.close}
          </button>
          <button type="button" className="create-btn" onClick={onSeeAll}>
            {t.seeAll}
          </button>
        </div>
      </div>
    </div>
  )
}