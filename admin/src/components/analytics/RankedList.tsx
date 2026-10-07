import { percent } from '../../utils/math'
import { imageUrl } from '../../utils/images'

// A ranked list: picture, name, bar, and a value on the right with its unit
// under it.
//
// mode "percent": the big value is the share of `total` ("25%"), with the
// count under it ("1 book"). The bar is that share.
// mode "count": the big value is the count ("3"), with the unit under it
// ("books"). The bar is relative to the largest count.

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
  unit?: [one: string, many: string]
  emptyText: string
}

export function RankedList({
  items,
  mode = 'percent',
  total = 0,
  unit = ['book', 'books'],
  emptyText,
}: Props) {
  if (items.length === 0) return <p className="muted">{emptyText}</p>

  const max = Math.max(1, ...items.map((i) => i.count))
  const hasImages = items.some((i) => i.image !== undefined)

  return (
    <ol className={hasImages ? 'ranked' : 'ranked no-img'}>
      {items.map((item) => {
        const share = percent(item.count, total)
        const width = mode === 'percent' ? share : (item.count / max) * 100
        const unitWord = item.count === 1 ? unit[0] : unit[1]

        return (
          <li key={item.key} className="ranked-row">
            {hasImages && (
              <div className="ranked-img">
                {item.image && <img src={imageUrl(item.image)} alt="" loading="lazy" />}
              </div>
            )}

            <div className="ranked-name">
              <span className="ranked-label">
                {item.sub && <span className="ranked-sub">{item.sub}</span>}
                {item.label}
              </span>
              {item.note && <span className="ranked-note">{item.note}</span>}
            </div>

            <div className="bar-track ranked-bar">
              <div className="bar-fill" style={{ width: `${width}%` }} />
            </div>

            <div className="ranked-value">
              <strong>{mode === 'percent' ? `${share}%` : item.count}</strong>
              <span>{mode === 'percent' ? `${item.count} ${unitWord}` : unitWord}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}