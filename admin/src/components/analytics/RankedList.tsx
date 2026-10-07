import { imageUrl } from '../../utils/images'

// A list ranked by count, with a bar for each row and an optional picture.
// Used for vegetables, Secrets categories, recipes, and secrets.

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
  emptyText: string
}

export function RankedList({ items, emptyText }: Props) {
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
              <span className="ranked-count">{item.count}</span>
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