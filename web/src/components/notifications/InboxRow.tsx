import { useLang } from '../../i18n/languageContext'
import { NOTIFICATIONS } from '../../i18n/strings/notifications'
import { useStrings } from '../../i18n/useStrings'
import { listTime } from '../../utils/notificationDates'
import type { NotificationItem } from '../../utils/notificationsApi'
import { ChevronRightIcon } from '../icons/LibraryIcons'

// One notification in the list, as a small page: a spine on the left,
// green while unread and gray once read, a spaced NEW label while unread,
// the text (two lines at most), and the time. Opens the notification's
// own page.

type Props = {
  item: NotificationItem
  onOpen: () => void
}

export function InboxRow({ item, onOpen }: Props) {
  const t = useStrings(NOTIFICATIONS)
  const { lang } = useLang()
  const unread = !item.read

  return (
    <button type="button" className={unread ? 'nf-page is-unread' : 'nf-page'} onClick={onOpen}>
      <span className="nf-page-spine" aria-hidden="true" />
      <span className="nf-page-body">
        {unread && (
          <span className="nf-page-new" aria-hidden="true">
            {t.newLabel}
          </span>
        )}
        <span className="nf-page-text">
          {unread && <span className="visually-hidden">{t.unreadLabel}: </span>}
          {item.text}
        </span>
        <span className="nf-page-meta">
          <span className="nf-page-time">{listTime(item.sentAt, lang)}</span>
          <ChevronRightIcon className="nf-page-chevron" />
        </span>
      </span>
    </button>
  )
}