import { useEffect, useRef } from 'react'
import { COMMON } from '../../i18n/strings/common'
import { NOTIFICATIONS } from '../../i18n/strings/notifications'
import { useStrings } from '../../i18n/useStrings'
import type { NotificationItem } from '../../utils/notificationsApi'
import { BellIcon } from '../icons/LibraryIcons'
import { LinkedText } from './LinkedText'

// The pop-up for a new message. Built on the confirm dialog's styles
// (dialog.css) so it looks like every other question in the app.
//
// View opens the Notifications screen. Close, a tap outside, or Escape
// closes it.

type Props = {
  item: NotificationItem
  onView: () => void
  onClose: () => void
  onLink: () => void
}

export function NotificationNotice({ item, onView, onClose, onLink }: Props) {
  const t = useStrings(NOTIFICATIONS)
  const common = useStrings(COMMON)
  const viewRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    viewRef.current?.focus()

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

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog nf-notice"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nf-notice-title"
        aria-describedby="nf-notice-text"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="nf-notice-head">
          <span className="nf-notice-icon">
            <BellIcon />
          </span>
          <h2 className="dialog-title" id="nf-notice-title">
            {t.alertTitle}
          </h2>
        </div>

        <p className="nf-notice-text" id="nf-notice-text">
          <LinkedText text={item.text} linkNote={t.linkNote} onLink={onLink} />
        </p>

        <div className="dialog-actions">
          <button ref={viewRef} type="button" className="create-btn" onClick={onView}>
            {t.view}
          </button>
          <button type="button" className="account-btn" onClick={onClose}>
            {common.close}
          </button>
        </div>
      </div>
    </div>
  )
}