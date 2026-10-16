import type { BookSummary } from '../../types/books'
import { keptText, kindText, languageText, savedText } from './bookFormat'
import { SafeImg } from './SafeImg'

// One book in the grid: its cover on top, then the vegetable or category,
// the book type, the research ID, when it was saved and in which language,
// and how many recipes or secrets it kept (and took out later).
//
// The cover is the book's built-in picture. An uploaded photo is never
// shown: the tile says it is a personal photo instead.

type Props = {
  book: BookSummary
  onOpen: () => void
}

export function BookTile({ book, onOpen }: Props) {
  const secrets = book.kind === 'secrets'

  return (
    <button type="button" className="bk-tile" onClick={onOpen}>
      <span className="bk-tile-cover">
        {book.personalCover ? (
          <span className="bk-personal">Personal photo, not shown</span>
        ) : (
          <SafeImg className="bk-tile-img" path={book.cover ?? book.background} />
        )}
      </span>
      <span className="bk-tile-body">
        <span className="bk-tile-title">
          <strong>{book.subject}</strong>
          <span className={secrets ? 'bk-type is-secrets' : 'bk-type'}>{kindText(book)}</span>
        </span>
        <span className="bk-id">{book.researchId}</span>
        <span className="bk-tile-line">
          {savedText(book.savedAt)}, {languageText(book.language)}
        </span>
        <span className="bk-tile-line">
          {keptText(book)}
          {book.removed > 0 && <strong className="bk-out">, {book.removed} taken out</strong>}
        </span>
      </span>
    </button>
  )
}