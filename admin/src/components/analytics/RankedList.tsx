import { percent } from '../../utils/math'
import { imageUrl } from '../../utils/images'

// A ranked list with a picture, a name, a bar, and a value on the right.
//
// mode "percent": the value is the share of `total`, and the bar is that
// share. The exact count shows on hover.
// mode "count": the value is the count, and the bar is relative to the
// largest count (for lists where a share means nothing, like top recipes).

export type RankedItem = {
  key: string
  label: string
  sub?: string | null
  image?: string | null
  count: number
  note?: string | null
}

type Props = {
  items: RankedItem[]
  mode?: 'percent' | 'count'
  total?: number
  emptyText: string
}

export function RankedList({ items, mode = 'percent', total = 0, emptyText }: Props) {
  if (items.length === 0) return <p className="muted">{emptyText}</p>

  const max = Math.max(1, ...items.map((i) => i.count))

  return (
    <ol className="ranked">
      {items.map((item) => {
        const share = percent(item.count, total)
        const width = mode === 'percent' ? share : (item.count / max) * 100
        return (
          <li key={item.key} className="ranked-row">
            {item.image !== undefined && (
              <div className="ranked-img">
                {item.image && <img src={imageUrl(item.image)} alt="" loading="lazy" />}
              </div>
            )}
            <div className="ranked-main">
              <span className="ranked-label">
                {item.sub && <span className="ranked-sub">{item.sub}</span>}
                {item.label}
              </span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${width}%` }} />
              </div>
              {item.note && <span className="ranked-note">{item.note}</span>}
            </div>
            <span
              className="ranked-value"
              title={mode === 'percent' ? `${item.count} of ${total}` : undefined}
            >
              {mode === 'percent' ? `${share}%` : item.count}
            </span>
          </li>
        )
      })}
    </ol>
  )
}