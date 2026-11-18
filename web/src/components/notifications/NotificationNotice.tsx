import { useEffect, useRef, useState } from 'react'
import { useLang } from '../../i18n/languageContext'
import { COMMON } from '../../i18n/strings/common'
import { NOTIFICATIONS } from '../../i18n/strings/notifications'
import { useStrings } from '../../i18n/useStrings'
import type { Lang } from '../../i18n/language'
import { coverSrc } from '../../utils/coverSrc'
import { listTime } from '../../utils/notificationDates'
import type { NotificationItem } from '../../utils/notificationsApi'
import { SafeImage } from '../common/SafeImage'
import { BellIcon } from '../icons/LibraryIcons'

// The pop-up for new notifications, as a stack of cards. The front card has
// a photo strip with the title and a close button, the message, its time
// and place in the stack, Next one (Close on the last) and Read more, and a
// link to all notifications. Up to two cards peek out behind it, each with
// its own photo. The photo is the linked playlist's first recipe, or the
// VeggieBook logo on header green when there is none. Tapping the message or
// Read more opens that notification's page. On a phone it sits at the
// bottom of the screen. Close, a tap outside, or Escape closes it.

type Props = {
  items: NotificationItem[]
  onSeeAll: () => void
  onOpen: (item: NotificationItem) => void
  onClose: () => void
}

function Photo({ item, lang, className }: { item: NotificationItem; lang: Lang; className: string }) {
  const photo = item.playlist?.photo
  if (photo) return <SafeImage className={className} src={coverSrc(photo)} />
  return (
    <span className={`${className} is-logo`}>
      <img src={`/brand/logo-negative-${lang}.png`} alt="" />
    </span>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function NotificationNotice({ items, onSeeAll, onOpen, onClose }: Props) {
  const t = useStrings(NOTIFICATIONS)
  const common = useStrings(COMMON)
  const { lang } = useLang()
  const [index, setIndex] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const position = Math.min(index, items.length - 1)
  const item = items[position]
  const many = items.length > 1
  const hasNext = position < items.length - 1
  const behind = items.slice(position + 1, position + 3)

  useEffect(() => {
    // Focus lands on the card itself, so no ring shows until Tab is used.
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
        className="dialog nf-sheet nf-stack"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nf-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        {behind[1] && (
          <span className="nf-stack-back is-far" aria-hidden="true">
            <Photo item={behind[1]} lang={lang} className="nf-stack-back-photo" />
          </span>
        )}
        {behind[0] && (
          <span className="nf-stack-back is-near" aria-hidden="true">
            <Photo item={behind[0]} lang={lang} className="nf-stack-back-photo" />
          </span>
        )}

        <div ref={cardRef} className="nf-stack-card" tabIndex={-1}>
          <div className="nf-stack-top">
            <Photo item={item} lang={lang} className="nf-stack-photo" />
            <h2 className="nf-stack-badge" id="nf-sheet-title">
              <BellIcon />
              {t.newTitle(items.length)}
            </h2>
            <button type="button" className="nf-stack-close" aria-label={common.close} onClick={onClose}>
              <CloseIcon />
            </button>
          </div>

          <div className="nf-stack-body">
            <button type="button" className="nf-stack-text" onClick={() => onOpen(item)}>
              {item.text}
            </button>

            <div className="nf-stack-meta">
              <span>{listTime(item.sentAt, lang)}</span>
              {many && (
                <span className="nf-stack-count" aria-live="polite">
                  {t.stepOf(position + 1, items.length)}
                </span>
              )}
            </div>

            <div className="nf-stack-actions">
              <button
                type="button"
                className="account-btn"
                onClick={hasNext ? () => setIndex(position + 1) : onClose}
              >
                {hasNext ? t.nextOne : common.close}
              </button>
              <button type="button" className="create-btn" onClick={() => onOpen(item)}>
                {t.readMore}
              </button>
            </div>

            <button type="button" className="nf-stack-all" onClick={onSeeAll}>
              {t.seeAllNotifications}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}