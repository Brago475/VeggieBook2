import { useState } from 'react'
import { BookCard } from '../components/BookCard'
import type { BookSummary, Vegetable } from '../types'

// Home screen: who is using the site, the two create buttons, then the books.
//
// Signed in, the books come from the account and are there on any device.
// For a guest, they are the books finished on this page, gone when it
// closes. The bar at the top says which, so a guest is never surprised.
//
// Each card follows the original app: the vegetable's photo fills the card
// and the chosen cover sits as a small inset. Opening a book is not built
// yet, so the cards are not clickable.

type Props = {
  email: string | null
  books: BookSummary[]
  vegetables: Vegetable[]
  loading: boolean
  error: string | null
  onCreateVeggie: () => void
  onAccount: () => void
  onSignIn: () => void
  onDeleteBook: (id: string) => Promise<void>
}

export function HomeLibrary({
  email,
  books,
  vegetables,
  loading,
  error,
  onCreateVeggie,
  onAccount,
  onSignIn,
  onDeleteBook,
}: Props) {
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const byCode = new Map<string, Vegetable>(vegetables.map((v) => [v.code, v]))

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete your ${name} book? This cannot be undone.`)) return
    setDeleteError(null)
    try {
      await onDeleteBook(id)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete this book.')
    }
  }

  return (
    <>
      <div className="account-bar">
        <span className="account-bar-text">
          {email ? `Signed in as ${email}` : 'Guest: your books are not saved'}
        </span>
        <button type="button" className="link-btn" onClick={email ? onAccount : onSignIn}>
          {email ? 'Account' : 'Sign in'}
        </button>
      </div>

      <div className="create-actions">
        <button type="button" className="create-btn" onClick={onCreateVeggie}>
          Create New VeggieBook
        </button>
        <button type="button" className="create-btn" disabled>
          Create New Secrets Book
        </button>
      </div>

      {loading && <p className="message">Loading your books...</p>}
      {error && <p className="message">{error}</p>}
      {deleteError && <p className="message">{deleteError}</p>}

      {!loading && !error && books.length === 0 && (
        <p className="message">
          You have not made any books yet. Start with Create New VeggieBook.
        </p>
      )}

      <ul>
        {books.map((book) => {
          const veg = book.vegetableCode ? byCode.get(book.vegetableCode) : undefined
          const name = veg?.name ?? 'VeggieBook'
          return (
            <li key={book.id} className="book-item">
              <BookCard
                title={name}
                background={veg ? `cover/${veg.shortCode}.jpg` : null}
                cover={book.cover}
              />
              <button
                type="button"
                className="book-delete"
                onClick={() => remove(book.id, name)}
              >
                Delete
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}