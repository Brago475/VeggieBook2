import { useLang } from '../../i18n/languageContext'
import { NOTIFICATIONS } from '../../i18n/strings/notifications'
import { useStrings } from '../../i18n/useStrings'
import { listTime } from '../../utils/notificationDates'
import type { NotificationItem } from '../../utils/notificationsApi'
import { BellIcon, ChevronRightIcon } from '../icons/LibraryIcons'

// One notification in the list, as its own card: a bell, the text (two
// lines at most), the time, and a New tag while unread. Opens the
// notification's own page.

type Props = {
  item: NotificationItem
  onOpen: () => void
}

export function InboxRow({ item, onOpen }: Props) {
  const t = useStrings(NOTIFICATIONS)
  const { lang } = useLang()
  const unread = !item.read

  return (
    <button type="button" className={unread ? 'nf-card is-unread' : 'nf-card'} onClick={onOpen}>
      <span className="nf-icon" aria-hidden="true">
        <BellIcon />
      </span>
      <span className="nf-card-body">
        <span className="nf-card-text">
          {unread && <span className="visually-hidden">{t.unreadLabel}: </span>}
          {item.text}
        </span>
        <span className="nf-card-meta">
          <span>{listTime(item.sentAt, lang)}</span>
          {unread && <span className="nf-new">{t.newLabel}</span>}
        </span>
      </span>
      <ChevronRightIcon className="nf-card-chevron" />
    </button>
  )
}