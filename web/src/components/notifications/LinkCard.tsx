import { NOTIFICATIONS } from '../../i18n/strings/notifications'
import { useStrings } from '../../i18n/useStrings'
import { hostOf } from '../../utils/messageLinks'
import { ExternalLinkIcon } from '../icons/LibraryIcons'

// A tappable card under a message for its web address, like a link
// preview in a chat.

type Props = {
  href: string
  onClick: () => void
}

export function LinkCard({ href, onClick }: Props) {
  const t = useStrings(NOTIFICATIONS)

  return (
    <a
      className="nf-linkcard"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
    >
      <span className="nf-linkcard-icon" aria-hidden="true">
        <ExternalLinkIcon />
      </span>
      <span className="nf-linkcard-text">
        <span className="nf-linkcard-host">{hostOf(href)}</span>
        <span className="nf-linkcard-note">{t.opensNewTab}</span>
      </span>
    </a>
  )
}