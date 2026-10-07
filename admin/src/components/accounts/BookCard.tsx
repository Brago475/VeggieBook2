import type { AdminBook, BookItem } from '../../types/admin'
import { formatDate, languageName } from '../../utils/format'

// One saved book on an account's page.
//
// A built-in cover is a shared public image, so it is shown. A personal
// cover is the user's own photo: the API never sends it, and this card only
// says "Personal cover".

type Props = {
  book: AdminBook
}

function imageUrl(path: string) {
  return `/images/${path.replace(/^\/+/, '')}`
}

function ItemList({ items }: { items: BookItem[] }) {
  return (
    <ol className="item-list">
      {items.map((item) => (
        <li key={`${item.type}-${item.id}`}>
          {item.code && <span className="item-code">{item.code}</span>}
          {item.title}
          {item.extraCopies > 0 && (
            <span className="item-extra">
              {' '}
              +{item.extraCopies} extra {item.extraCopies === 1 ? 'copy' : 'copies'}
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}

export function BookCard({ book }: Props) {
  const isVeggie = book.kind === 'veggie'
  const title = isVeggie
    ? `VeggieBook: ${book.vegetable?.name ?? 'Unknown vegetable'}`
    : `Secrets Book: ${book.secretCategory?.name ?? 'Unknown category'}`
  const itemLabel = isVeggie ? 'Recipes' : 'Secrets'

  return (
    <article className="card book">
      <div className="book-cover">
        {book.cover.type === 'personal' ? (
          <span className="book-cover-text">Personal cover</span>
        ) : book.cover.path ? (
          <img src={imageUrl(book.cover.path)} alt="" loading="lazy" />
        ) : (
          <span className="book-cover-text">No cover</span>
        )}
      </div>

      <div className="book-body">
        <h3 className="book-title">{title}</h3>
        <p className="muted small">
          Saved {formatDate(book.createdAt)} · {languageName(book.language)} ·{' '}
          {book.kept.length} {itemLabel.toLowerCase()}
        </p>

        {book.answers.length > 0 && (
          <div className="book-section">
            <h4 className="book-section-title">Answers</h4>
            <div className="chips">
              {book.answers.map((a) => (
                <span key={a} className="chip">
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="book-section">
          <h4 className="book-section-title">{itemLabel} kept</h4>
          <ItemList items={book.kept} />
        </div>

        {book.removed.length > 0 && (
          <details className="book-section">
            <summary className="book-section-title">
              Taken out later ({book.removed.length})
            </summary>
            <ItemList items={book.removed} />
          </details>
        )}
      </div>
    </article>
  )
}