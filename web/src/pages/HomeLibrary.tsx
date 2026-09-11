import type { SavedBook } from '../types'
import { coverSrc } from '../utils/coverSrc'

// Home screen. Two create buttons, then the books already made, shown as
// large photo cards with the name overlaid.
//
// The Secrets flow does not exist yet, so that button is disabled rather
// than hidden: the original app's layout is what faculty will recognize.

type Props = {
  books: SavedBook[]
  onCreateVeggie: () => void
}

export function HomeLibrary({ books, onCreateVeggie }: Props) {
  return (
    <>
      <div className="create-actions">
        <button
          type="button"
          className="create-btn"
          onClick={onCreateVeggie}
        >
          Create New VeggieBook
        </button>
        <button type="button" className="create-btn" disabled>
          Create New Secrets Book
        </button>
      </div>

      {books.length === 0 ? (
        <p className="message">
          You have not made any books yet. Start with Create New VeggieBook.
        </p>
      ) : (
        <ul>
          {books.map((book) => (
            <li key={book.id}>
              <button type="button" className="book-card">
                <img
                  className="book-card-img"
                  src={coverSrc(book.image)}
                  alt=""
                  loading="lazy"
                />
                <span className="book-card-name">{book.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}