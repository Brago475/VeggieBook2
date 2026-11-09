import { useEffect, useRef } from 'react'
import { SafeImage } from '../common/SafeImage'
import { PLAYLISTS } from '../../i18n/strings/playlists'
import { useStrings } from '../../i18n/useStrings'
import { coverSrc } from '../../utils/coverSrc'
import type { BookChoice } from '../../utils/playlistsApi'

// One saved book in the playlist maker. Closed it shows the book and how
// many of its recipes are picked; open it lists them to tap.

type Props = {
  book: BookChoice
  open: boolean
  picked: number[]
  onOpen: () => void
  onToggle: (recipeId: number) => void
  onSetMany: (recipeIds: number[], on: boolean) => void
}

function Check({ on }: { on: boolean }) {
  return (
    <span className="pl-check" aria-hidden="true">
      {on && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}

export function BookPicker({ book, open, picked, onOpen, onToggle, onSetMany }: Props) {
  const t = useStrings(PLAYLISTS)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [open])

  const ids = book.recipes.map((r) => r.id)
  const count = ids.filter((id) => picked.includes(id)).length
  const cover = book.recipes.find((r) => r.photo)?.photo ?? null
  const bodyId = `pl-book-${book.id}`

  return (
    <section ref={ref} className={open ? 'pl-book is-open' : 'pl-book'}>
      <button type="button" className="pl-book-head" aria-expanded={open} aria-controls={bodyId} onClick={onOpen}>
        <SafeImage className="pl-book-cover" src={cover ? coverSrc(cover) : null} />
        <span className="pl-book-text">
          <span className="pl-book-name">{t.fromBook(book.vegetableName)}</span>
          <span className="pl-book-meta">{t.bookRecipes(book.recipes.length)}</span>
        </span>
        {count > 0 && <span className="pl-book-badge">{t.bookPicked(count)}</span>}
        <svg className="pl-book-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div id={bodyId} className="pl-book-body">
          <div className="pl-book-tools">
            <button type="button" className="pl-book-link" onClick={() => onSetMany(ids, true)} disabled={count === ids.length}>
              {t.pickAll}
            </button>
            <button type="button" className="pl-book-link" onClick={() => onSetMany(ids, false)} disabled={count === 0}>
              {t.clearBook}
            </button>
          </div>

          <ul className="nf-list">
            {book.recipes.map((r) => {
              const on = picked.includes(r.id)
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    className={on ? 'pl-pick is-on' : 'pl-pick'}
                    aria-pressed={on}
                    onClick={() => onToggle(r.id)}
                  >
                    <SafeImage className="recipe-thumb" src={r.photo ? coverSrc(r.photo) : null} />
                    <span className="pl-pick-title">{r.title}</span>
                    <Check on={on} />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}