import { PLAYLISTS } from '../../i18n/strings/playlists'
import { useStrings } from '../../i18n/useStrings'

// Messages and Playlists, the two parts of Notifications.

type Props = {
  active: 'messages' | 'playlists'
  onMessages: () => void
  onPlaylists: () => void
}

export function SectionSwitch({ active, onMessages, onPlaylists }: Props) {
  const t = useStrings(PLAYLISTS)

  return (
    <div className="pl-switch" role="tablist" aria-label={t.sections}>
      <button
        type="button"
        role="tab"
        aria-selected={active === 'messages'}
        className="pl-switch-btn"
        onClick={active === 'messages' ? undefined : onMessages}
      >
        {t.messages}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === 'playlists'}
        className="pl-switch-btn"
        onClick={active === 'playlists' ? undefined : onPlaylists}
      >
        {t.playlists}
      </button>
    </div>
  )
}