import { imageUrl } from '../../utils/images'

// Picture cards in a grid: image, name, the number, and a thin green bar.
// Used for vegetables, Secrets categories, recipes, secrets, and covers.

export type PictureItem = {
  key: string
  image: string | null
  title: string
  code?: string | null
  value: string
  detail?: string
  bar: number
  warn?: string | null
}

type Props = {
  items: PictureItem[]
  emptyText: string
}

export function PictureGrid({ items, emptyText }: Props) {
  if (items.length === 0) return <p className="muted">{emptyText}</p>

  return (
    <ul className="card-grid cols-4">
      {items.map((item) => (
        <li key={item.key} className="picture-card">
          <div className="picture-img">
            {item.image && <img src={imageUrl(item.image)} alt="" loading="lazy" />}
          </div>
          <p className="picture-title">
            {item.code && <span className="picture-code">{item.code}</span>}
            {item.title}
          </p>
          <p className="picture-value">
            <strong>{item.value}</strong>
            {item.detail && <span>{item.detail}</span>}
          </p>
          <div className="bar">
            <div className="bar-fill" style={{ width: `${Math.min(item.bar, 100)}%` }} />
          </div>
          {item.warn && <p className="picture-warn">{item.warn}</p>}
        </li>
      ))}
    </ul>
  )
}