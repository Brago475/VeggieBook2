import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'
import '../../styles/zoom.css'
import { imageUrl } from '../../utils/images'

// A photo that shows a larger copy beside it while the pointer rests on it.
// The copy keeps the photo's shape and is drawn on the page body, so dialogs
// and scroll boxes do not clip it. Photos already shown large do not zoom.
// The copy closes when the pointer leaves or the page scrolls.

const MAX = 320
const GAP = 12
const DELAY_MS = 120
const BIG_ENOUGH = 220

type Box = { left: number; top: number; width: number; height: number }

// Right of the photo when there is room, otherwise left, kept on screen.
function boxFor(el: HTMLImageElement): Box | null {
  const rect = el.getBoundingClientRect()
  if (Math.max(rect.width, rect.height) >= BIG_ENOUGH) return null

  const ratio = el.naturalWidth > 0 && el.naturalHeight > 0 ? el.naturalWidth / el.naturalHeight : 1
  const width = ratio >= 1 ? MAX : Math.round(MAX * ratio)
  const height = ratio >= 1 ? Math.round(MAX / ratio) : MAX

  const vw = window.innerWidth
  const vh = window.innerHeight
  let left = rect.right + GAP
  if (left + width > vw - GAP) left = rect.left - GAP - width
  left = Math.max(GAP, Math.min(left, vw - width - GAP))
  const top = Math.max(GAP, Math.min(rect.top + rect.height / 2 - height / 2, vh - height - GAP))
  return { left, top, width, height }
}

type Props = {
  photo: string
  className?: string
  alt?: string
  onError?: (e: SyntheticEvent<HTMLImageElement>) => void
}

export function ZoomImage({ photo, className, alt = '', onError }: Props) {
  const [box, setBox] = useState<Box | null>(null)
  const timer = useRef<number | null>(null)
  const src = imageUrl(photo)

  function cancel() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  useEffect(() => {
    if (!box) return
    const hide = () => setBox(null)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [box])

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
        alt={alt}
        loading="lazy"
        onError={onError}
        onMouseEnter={(e) => {
          const el = e.currentTarget
          cancel()
          timer.current = window.setTimeout(() => setBox(boxFor(el)), DELAY_MS)
        }}
        onMouseLeave={() => {
          cancel()
          setBox(null)
        }}
      />
      {box &&
        createPortal(
          <img
            className="zm-big"
            src={src}
            alt=""
            style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
          />,
          document.body,
        )}
    </>
  )
}