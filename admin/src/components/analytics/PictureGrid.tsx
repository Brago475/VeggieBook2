import { imageUrl } from '../../utils/images'
import '../../styles/content.css'

// Picture cards in a grid: image, name, the number, and a thin green bar.
// Used for vegetables, Secrets categories, recipes, secrets, and covers.
//
// When onSelect is given, each card is a button that opens that item
// (recipes and secrets open in a side panel).

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
  onSelect?: (key: string) => void
}

export function PictureGrid({ items, emptyText, onSelect }: Props) {
  if (items.length === 0) return <p className="muted">{emptyText}</p>

  return (
    <ul className="card-grid cols-4">
      {items.map((item) => {
        const body = (
          <>
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
          </>
        )

        return (
          <li key={item.key}>
            {onSelect ? (
              <button
                type="button"
                className="picture-card is-clickable"
                onClick={() => onSelect(item.key)}
              >
                {body}
              </button>
            ) : (
              <div className="picture-card">{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}