import type { BookDetail, BookItem } from '../../types/books'
import { itemNoun } from './bookFormat'
import { SafeImg } from './SafeImg'

// A book's list of recipes or secrets, laid out the way the app shows a
// saved book (web/src/pages/BookViewer.tsx and SecretBookViewer.tsx):
//
//   the heading     the leaf mark, a small "THEIR", the book's name
//   the cover card  the vegetable's photo (or the category's picture) with
//                   the chosen cover inset on the right
//   the count pill  "14 recipes"
//   the rows        a picture, the title in green, and a chevron
//
// Two differences from the app, for the research team:
//   - no ⋮ menus: admins can't change or delete anything
//   - recipes or secrets the person took out later stay, at the bottom,
//     faded and crossed out, and can still be opened
//
// An uploaded cover photo is never shown, only marked as personal.

type Props = {
  detail: BookDetail
  onOpen: (item: BookItem) => void
}

function Chevron() {
  return (
    <svg className="vb-row-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function VbBookList({ detail, onOpen }: Props) {
  const { book, keptItems, removedItems } = detail
  const secrets = book.kind === 'secrets'
  const title = secrets ? book.subject : `${book.subject} VeggieBook`

  function row(item: BookItem, out: boolean) {
    return (
      <li key={`${item.type}-${item.id}`}>
        <button type="button" className={out ? 'vb-row is-out' : 'vb-row'} onClick={() => onOpen(item)}>
          <SafeImg className={secrets ? 'vb-thumb is-secret' : 'vb-thumb'} path={item.image} />
          <span className="vb-row-title">{item.title}</span>
          {out ? <span className="vb-out-tag">Taken out</span> : <Chevron />}
        </button>
      </li>
    )
  }

  return (
    <div className="vb-book">
      <div className="vb-heading">
        <span className="vb-heading-mark" aria-hidden="true">
          <svg viewBox="0 0 40 40">
            <path d="M20 34c-1-9 2-16 11-22-1 11-5 18-11 22z" fill="#ffffff" />
            <path d="M19 34C13 28 9 21 10 10c7 6 10 14 9 24z" fill="#ffffff" opacity="0.7" />
          </svg>
        </span>
        <span className="vb-heading-text">
          <span className="vb-eyebrow">Their</span>
          <span className="vb-title">{title}</span>
        </span>
      </div>

      <div className="vb-cover-wrap">
        <div className="vb-card">
          <SafeImg className="vb-card-bg" path={book.background} />
          {book.personalCover ? (
            <span className="vb-card-cover is-personal">Personal photo</span>
          ) : (
            <SafeImg className="vb-card-cover" path={book.cover} />
          )}
          <span className="vb-card-text">
            <span className="vb-card-name">{book.subject}</span>
            <span className="vb-card-label">{secrets ? 'Secrets Book' : 'VeggieBook'}</span>
          </span>
        </div>
      </div>

      <p className="vb-count">
        <span className="vb-count-pill">
          {keptItems.length} {itemNoun(book.kind, keptItems.length)}
        </span>
      </p>

      <ul className="vb-rows">{keptItems.map((item) => row(item, false))}</ul>

      {removedItems.length > 0 && (
        <>
          <p className="vb-out-head">Taken out later ({removedItems.length})</p>
          <ul className="vb-rows">{removedItems.map((item) => row(item, true))}</ul>
        </>
      )}
    </div>
  )
}