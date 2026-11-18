import { NavIcon } from '../icons/NavIcons'
import { ZoomImage } from './ZoomImage'

// Up to four playlist photos. One fills the frame; two to four share a
// 2 by 2 grid with plain tiles in the gaps; none shows a leaf.

export function PlaylistCollage({ photos }: { photos: string[] }) {
  if (photos.length === 0) {
    return (
      <div className="plc-collage is-single is-empty" aria-hidden="true">
        <NavIcon name="leaf" size={32} />
      </div>
    )
  }
  if (photos.length === 1) {
    return (
      <div className="plc-collage is-single">
        <ZoomImage photo={photos[0]} />
      </div>
    )
  }
  const tiles = [0, 1, 2, 3].map((i) => photos[i] ?? null)
  return (
    <div className="plc-collage">
      {tiles.map((photo, i) =>
        photo ? <ZoomImage key={i} photo={photo} /> : <span key={i} className="plc-tile" aria-hidden="true" />,
      )}
    </div>
  )
}