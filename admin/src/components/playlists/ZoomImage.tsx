import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import '../../styles/zoom.css'
import { imageUrl } from '../../utils/images'

// A photo that shows a larger copy beside it while the pointer rests on it.
// The copy is drawn on the page body so dialogs and scroll boxes do not
// clip it. It closes when the pointer leaves or the page scrolls.

const SIZE = 280
const GAP = 12
const DELAY_MS = 120

type Spot = { left: number; top: number }

// Right of the photo when there is room, otherwise left, kept on screen.
function place(rect: DOMRect): Spot {
  const vw = window.innerWidth
  const vh = window.innerHeight
  let left = rect.right + GAP
  if (left + SIZE > vw - GAP) left = rect.left - GAP - SIZE
  left = Math.max(GAP, Math.min(left, vw - SIZE - GAP))
  const top = Math.max(GAP, Math.min(rect.top + rect.height / 2 - SIZE / 2, vh - SIZE - GAP))
  return { left, top }
}

type Props = {
  photo: string
  className?: string
}

export function ZoomImage({ photo, className }: Props) {
  const [spot, setSpot] = useState<Spot | null>(null)
  const timer = useRef<number | null>(null)
  const src = imageUrl(photo)

  function cancel() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  useEffect(() => {
    if (!spot) return
    const hide = () => setSpot(null)
    window.addEventListener('scroll', hide, true)
    return () => window.removeEventListener('scroll', hide, true)
  }, [spot])

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )

  return (
    <>
      <img
        className={className}
        src={src}
        alt=""
        loading="lazy"
        onMouseEnter={(e) => {
          const el = e.currentTarget
          cancel()
          timer.current = window.setTimeout(() => setSpot(place(el.getBoundingClientRect())), DELAY_MS)
        }}
        onMouseLeave={() => {
          cancel()
          setSpot(null)
        }}
      />
      {spot &&
        createPortal(
          <img
            className="zm-big"
            src={src}
            alt=""
            style={{ left: spot.left, top: spot.top, width: SIZE, height: SIZE }}
          />,
          document.body,
        )}
    </>
  )
}