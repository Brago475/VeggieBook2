import { coverSrc } from '../../utils/coverSrc'
import { SafeImage } from '../common/SafeImage'

// A row of saved book covers in the playlist picker. One book is open at a
// time; a badge shows how many of its recipes are picked.

export type ShelfBook = {
  id: string
  name: string
  date: string
  cover: string | null
  picked: number
}

type Props = {
  label: string
  books: ShelfBook[]
  active: string
  onChange: (id: string) => void
}

export function BookShelf({ label, books, active, onChange }: Props) {
  return (
    <div className="pk-shelf" role="group" aria-label={label}>
      {books.map((b) => {
        const on = b.id === active
        return (
          <button
            key={b.id}
            type="button"
            className={on ? 'pk-book is-on' : 'pk-book'}
            aria-pressed={on}
            onClick={() => onChange(b.id)}
          >
            <SafeImage className="pk-book-cover" src={b.cover ? coverSrc(b.cover) : null} />
            {b.picked > 0 && <span className="pk-book-badge">{b.picked}</span>}
            <span className="pk-book-text">
              <span className="pk-book-name">{b.name}</span>
              {b.date && <span className="pk-book-date">{b.date}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}