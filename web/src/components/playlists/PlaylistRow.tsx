import { coverSrc } from '../../utils/coverSrc'
import { SafeImage } from '../common/SafeImage'
import { ChevronRightIcon } from '../icons/LibraryIcons'

// One playlist in the Playlists tab: its first recipe's photo, the name,
// what it holds, and a chevron.

type Props = {
  name: string
  detail: string
  cover: string | null
  onOpen: () => void
}

export function PlaylistRow({ name, detail, cover, onOpen }: Props) {
  return (
    <button type="button" className="nf-card pl-row" onClick={onOpen}>
      <SafeImage className="pl-row-cover" src={cover ? coverSrc(cover) : null} />
      <span className="nf-card-body">
        <span className="pl-row-name">{name}</span>
        <span className="nf-card-meta">{detail}</span>
      </span>
      <ChevronRightIcon className="nf-card-chevron" />
    </button>
  )
}