import { useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import type { PlaylistKind } from '../../types/playlists'
import { imageUrl } from '../../utils/images'
import { ItemThumb } from '../playlists/ItemBits'

// A thumbnail that shows a large copy of its photo beside it on hover.

const SIZE = 240
const GAP = 12

export function ZoomThumb({ kind, photo }: { kind: PlaylistKind; photo: string | null }) {
  const [at, setAt] = useState<{ top: number; left: number } | null>(null)

  if (!photo) return <ItemThumb kind={kind} photo={null} />

  function show(e: MouseEvent<HTMLSpanElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const fitsRight = r.right + GAP + SIZE < window.innerWidth
    const left = fitsRight ? r.right + GAP : Math.max(8, r.left - GAP - SIZE)
    const top = Math.min(Math.max(8, r.top + r.height / 2 - SIZE / 2), window.innerHeight - SIZE - 8)
    setAt({ top, left })
  }

  return (
    <span className="ps-zoom" onMouseEnter={show} onMouseLeave={() => setAt(null)}>
      <ItemThumb kind={kind} photo={photo} />
      {at &&
        createPortal(
          <img
            className="ps-zoom-big"
            src={imageUrl(photo)}
            alt=""
            style={{ top: at.top, left: at.left, width: SIZE, height: SIZE }}
          />,
          document.body,
        )}
    </span>
  )
}