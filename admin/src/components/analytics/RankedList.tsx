import { percent } from '../../utils/math'
import { imageUrl } from '../../utils/images'

// A list ranked by count, with a bar for each row and an optional picture.
// Used for vegetables, Secrets categories, recipes, secrets, and languages.
//
// When `total` is given, each row also shows its share of that total, so
// "3" reads as "3 · 60%".

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
  total?: number
  emptyText: string
}

export function RankedList({ items, total, emptyText }: Props) {
  const max = Math.max(1, ...items.map((i) => i.count))

  if (items.length === 0) return <p className="muted">{emptyText}</p>

  return (
    <ol className="ranked">
      {items.map((item) => (
        <li key={item.key} className="ranked-row">
          {item.image !== undefined && (
            <div className="ranked-img">
              {item.image && <img src={imageUrl(item.image)} alt="" loading="lazy" />}
            </div>
          )}
          <div className="ranked-body">
            <div className="ranked-top">
              <span className="ranked-label">
                {item.sub && <span className="ranked-sub">{item.sub}</span>}
                {item.label}
              </span>
              <span className="ranked-count">
                {item.count}
                {total !== undefined && (
                  <span className="ranked-share"> · {percent(item.count, total)}%</span>
                )}
              </span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
            {item.note && <span className="ranked-note">{item.note}</span>}
          </div>
        </li>
      ))}
    </ol>
  )
}