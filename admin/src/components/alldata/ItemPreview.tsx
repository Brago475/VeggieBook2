import { useEffect, useState, type FocusEvent, type MouseEvent } from 'react'
import type { SheetRow } from '../../types/research'
import { bookTitle, shortDate, shortTime } from '../../utils/allDataFormat'
import { imageUrl } from '../../utils/images'

// Small pictures for recipes and secrets, and the card that opens when you
// hover (or tab to) one: the full picture, the name, kept or taken out,
// and when the book was saved.
//
// The card is placed next to the item on screen (fixed position), so it is
// never cut off by a scrolling panel or table. It closes when the mouse
// leaves, focus moves on, or the page scrolls.

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
    return () => window.removeEventListener('scroll', hide, true)
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
      <span className={secret ? 'ad-thumb is-empty is-violet' : 'ad-thumb is-empty'} aria-hidden="true">
        {String(row.item_title ?? '?').charAt(0)}
      </span>
    )
  }

  return <img className="ad-thumb" src={imageUrl(path)} alt="" loading="lazy" onError={() => setBroken(true)} />
}

export function ItemPreviewCard({ preview }: { preview: Preview | null }) {
  if (!preview) return null

  const { row, rect } = preview
  const path = picturePath(row)
  const out = row.status !== 'Kept'
  const secret = row.item_type === 'Secret'
  const copies = Number(row.extra_copies ?? 0)

  // Left of the item when there is room, otherwise right of it.
  let left = rect.left - CARD_WIDTH - GAP
  if (left < GAP) left = rect.right + GAP
  const top = Math.max(GAP, Math.min(rect.top - 40, window.innerHeight - CARD_HEIGHT - GAP))

  return (
    <div className="ad-preview" role="tooltip" style={{ left, top, width: CARD_WIDTH }}>
      {path ? (
        <img className="ad-preview-img" src={imageUrl(path)} alt="" />
      ) : (
        <div className="ad-preview-img is-empty">No picture</div>
      )}
      <div className="ad-preview-body">
        <div className="ad-preview-tags">
          {row.item_code && <span className="ad-code">{String(row.item_code)}</span>}
          <span className={secret ? 'ad-type is-violet' : 'ad-type is-green'}>{String(row.item_type ?? '')}</span>
          <span className={out ? 'ad-pill is-out' : 'ad-pill is-kept'}>{out ? 'Taken out later' : 'Kept'}</span>
        </div>
        <strong className="ad-preview-title">{String(row.item_title ?? '')}</strong>
        <dl className="ad-preview-facts">
          <dt>Book</dt>
          <dd>
            {bookTitle(row)}, book {String(row.book_no)}
          </dd>
          <dt>Saved</dt>
          <dd>
            <span className="ad-date">
              {String(row.day ?? '').slice(0, 3)} {shortDate(row.date)}
            </span>{' '}
            <span className="ad-time">{shortTime(row.time)}</span>
          </dd>
          {out && (
            <>
              <dt>Taken out</dt>
              <dd className="ad-faint">Time not recorded yet</dd>
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