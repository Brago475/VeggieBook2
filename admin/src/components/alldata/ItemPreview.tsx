import { useEffect, useState, type FocusEvent, type MouseEvent } from 'react'
import type { SheetRow } from '../../types/research'
import { bookTitle, shortDate, shortTime } from '../../utils/allDataFormat'
import { imageUrl } from '../../utils/images'

// Small pictures for recipes and secrets, and the card that opens when you
// hover (or tab to, or tap on a phone) one: the full picture, the name,
// kept or taken out, and when the book was saved.
//
// The card is placed next to the item on screen (fixed position), so it is
// never cut off by a scrolling panel or table, and it always fits inside
// the window, whatever the screen size. It closes when the mouse leaves,
// focus moves on, or the page scrolls.

export type Preview = {
  row: SheetRow
  rect: DOMRect
}

const CARD_WIDTH = 320
const CARD_HEIGHT = 460
const GAP = 12

export function useItemPreview() {
  const [preview, setPreview] = useState<Preview | null>(null)

  useEffect(() => {
    if (!preview) return
    const hide = () => setPreview(null)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [preview])

  function handlers(row: SheetRow) {
    const show = (e: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) =>
      setPreview({ row, rect: e.currentTarget.getBoundingClientRect() })
    const hide = () => setPreview(null)
    return { onMouseEnter: show, onMouseLeave: hide, onFocus: show, onBlur: hide }
  }

  return { preview, handlers }
}

function picturePath(row: SheetRow): string | null {
  return typeof row.item_image === 'string' && row.item_image ? row.item_image : null
}

// A small square picture, or the item's first letter if it has none.
export function ItemThumb({ row }: { row: SheetRow }) {
  const [broken, setBroken] = useState(false)
  const path = picturePath(row)
  const secret = row.item_type === 'Secret'

  if (!path || broken) {
    return (
      <span className={secret ? 'vbd-thumb is-empty is-violet' : 'vbd-thumb is-empty'} aria-hidden="true">
        {String(row.item_title ?? '?').charAt(0)}
      </span>
    )
  }

  return <img className="vbd-thumb" src={imageUrl(path)} alt="" loading="lazy" onError={() => setBroken(true)} />
}

export function ItemPreviewCard({ preview }: { preview: Preview | null }) {
  if (!preview) return null

  const { row, rect } = preview
  const path = picturePath(row)
  const out = row.status !== 'Kept'
  const secret = row.item_type === 'Secret'
  const copies = Number(row.extra_copies ?? 0)

  // Fits any screen: never wider than the window, placed left of the item
  // when there is room, otherwise right of it, otherwise under it, and
  // always kept inside the window.
  const width = Math.min(CARD_WIDTH, window.innerWidth - GAP * 2)
  const maxLeft = window.innerWidth - width - GAP
  let left = rect.left - width - GAP
  let top = rect.top - 40
  if (left < GAP) left = rect.right + GAP
  if (left > maxLeft) {
    left = Math.max(GAP, Math.min(rect.left, maxLeft))
    top = rect.bottom + GAP
  }
  top = Math.max(GAP, Math.min(top, window.innerHeight - CARD_HEIGHT - GAP))

  return (
    <div className="vbd-preview" role="tooltip" style={{ left, top, width }}>
      {path ? (
        <img className="vbd-preview-img" src={imageUrl(path)} alt="" />
      ) : (
        <div className="vbd-preview-img is-empty">No picture</div>
      )}
      <div className="vbd-preview-body">
        <div className="vbd-preview-tags">
          {row.item_code && <span className="vbd-code">{String(row.item_code)}</span>}
          <span className={secret ? 'vbd-type is-violet' : 'vbd-type is-green'}>{String(row.item_type ?? '')}</span>
          <span className={out ? 'vbd-pill is-out' : 'vbd-pill is-kept'}>{out ? 'Taken out' : 'Kept'}</span>
        </div>
        <strong className="vbd-preview-title">{String(row.item_title ?? '')}</strong>
        <dl className="vbd-preview-facts">
          <dt>Book</dt>
          <dd>
            {bookTitle(row)}, book {String(row.book_no)}
          </dd>
          <dt>Saved</dt>
          <dd>
            <span className="vbd-date">
              {String(row.day ?? '').slice(0, 3)} {shortDate(row.date)}
            </span>{' '}
            <span className="vbd-time">{shortTime(row.time)}</span>
          </dd>
          {out && (
            <>
              <dt>Taken out</dt>
              <dd className="vbd-faint">Time not recorded yet</dd>
            </>
          )}
          {copies > 0 && (
            <>
              <dt>Extra copies</dt>
              <dd>{copies}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  )
}