import { PlusIcon } from './PlaylistIcons'

// Dashed card at the top of the Playlists tab that starts a new playlist.

type Props = {
  title: string
  sub: string
  onClick: () => void
}

export function NewPlaylistCard({ title, sub, onClick }: Props) {
  return (
    <button type="button" className="pl-newcard" onClick={onClick}>
      <span className="pl-newcard-icon" aria-hidden="true">
        <PlusIcon />
      </span>
      <span className="pl-newcard-text">
        <span className="pl-newcard-title">{title}</span>
        <span className="pl-newcard-sub">{sub}</span>
      </span>
    </button>
  )
}