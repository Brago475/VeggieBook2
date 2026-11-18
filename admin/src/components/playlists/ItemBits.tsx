import type { PlaylistKind } from '../../types/playlists'
import { NavIcon } from '../icons/NavIcons'
import { ZoomImage } from './ZoomImage'

// Small pieces shared by the playlist screens.

export function KindTag({ kind }: { kind: PlaylistKind }) {
  return <span className={`pl-kind is-${kind}`}>{kind === 'tip' ? 'Tip' : 'Recipe'}</span>
}

// A small square photo that enlarges on hover, or an icon when there is none.
export function ItemThumb({ kind, photo }: { kind: PlaylistKind; photo: string | null | undefined }) {
  if (photo) return <ZoomImage className="pl-thumb" photo={photo} />
  return (
    <span className="pl-thumb" aria-hidden="true">
      <NavIcon name={kind === 'tip' ? 'leaf' : 'content'} size={18} />
    </span>
  )
}