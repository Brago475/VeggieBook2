import { SafeImg } from '../books/SafeImg'

// A searchable checklist of recipes or secrets for Specific data.

export type PickItem = {
  id: number
  title: string
  sub: string | null
  tag: string
  image: string | null
  uses: number
}

type Props = {
  items: PickItem[]
  picked: Set<number>
  onToggle: (id: number) => void
  limit: number
}

export function ItemPicker({ items, picked, onToggle, limit }: Props) {
  if (items.length === 0) return <p className="ex-empty">Nothing matches.</p>

  return (
    <div className="ex-list">
      {items.slice(0, limit).map((i) => (
        <label key={i.id} className={picked.has(i.id) ? 'ex-list-row is-on' : 'ex-list-row'}>
          <input type="checkbox" checked={picked.has(i.id)} onChange={() => onToggle(i.id)} />
          <span className="ex-list-img">{i.image && <SafeImg className="ex-list-pic" path={i.image} />}</span>
          <span className="ex-list-text">
            <strong>{i.title}</strong>
            <span>
              {i.sub ? `${i.sub}   ` : ''}
              {i.tag}
            </span>
          </span>
          <span className="ex-list-uses">
            In {i.uses.toLocaleString()} {i.uses === 1 ? 'book' : 'books'}
          </span>
        </label>
      ))}
      {items.length > limit && (
        <p className="ex-list-more">Showing {limit} of {items.length}. Search to narrow the list.</p>
      )}
    </div>
  )
}