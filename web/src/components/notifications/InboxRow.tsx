import { useLang } from '../../i18n/languageContext'
import { NOTIFICATIONS } from '../../i18n/strings/notifications'
import { useStrings } from '../../i18n/useStrings'
import { listTime } from '../../utils/notificationDates'
import type { NotificationItem } from '../../utils/notificationsApi'
import { LeafIcon } from '../icons/LibraryIcons'

// One message in the inbox: sender, time, and a two-line preview. Unread
// messages carry a green dot and bold text.

type Props = {
  item: NotificationItem
  onOpen: () => void
}

export function InboxRow({ item, onOpen }: Props) {
  const t = useStrings(NOTIFICATIONS)
  const { lang } = useLang()
  const unread = !item.read

  return (
    <button
      type="button"
      className={unread ? 'nf-row is-unread' : 'nf-row'}
      onClick={onOpen}
    >
      <span className={unread ? 'nf-avatar' : 'nf-avatar is-muted'} aria-hidden="true">
        <LeafIcon />
        {unread && <span className="nf-avatar-dot" />}
      </span>
      <span className="nf-row-body">
        <span className="nf-row-top">
          <span className="nf-sender">{t.sender}</span>
          <span className="nf-time">{listTime(item.sentAt, lang)}</span>
        </span>
        <span className="nf-preview">
          {unread && <span className="visually-hidden">{t.unreadLabel}: </span>}
          {item.text}
        </span>
      </span>
    </button>
  )
}