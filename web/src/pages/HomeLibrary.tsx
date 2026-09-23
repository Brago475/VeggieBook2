import { useState } from 'react'
import { ActionMenu } from '../components/ActionMenu'
import { BookCard } from '../components/BookCard'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  ChevronRightIcon,
  GearIcon,
  LockIcon,
  PersonIcon,
  PlusIcon,
} from '../components/LibraryIcons'
import type { BookSummary, Vegetable } from '../types'

// Home screen: a heading that says who is using the site, the two create
// buttons, then the books.
//
// Signed in, the books come from the account and are there on any device.
// For a guest, they are the books finished on this page, gone when it
// closes. The line under the heading says which, so a guest is never
// surprised.
//
// Each card follows the original app: the vegetable's photo fills the card
// and the chosen cover sits as a small inset. A signed-in account can open a
// card to read the book's recipes. A guest's book has no id on the server,
// so onViewBook is not passed and its cards stay unclickable. Actions on a
// book live in the ⋮ on its card.
//
// While the books load, two gray card shapes hold their place, so the list
// does not pop in under a line of text.

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
  onViewBook?: (id: string) => void
}

const SKELETON_CARDS = 2

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
  onViewBook,
}: Props) {
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // The book awaiting confirmation. The name is held alongside the id so the
  // question can say which book, rather than "this book".
  const [pending, setPending] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const byCode = new Map<string, Vegetable>(vegetables.map((v) => [v.code, v]))

  async function confirmDelete() {
    if (!pending || deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await onDeleteBook(pending.id)
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Could not delete this book.',
      )
    } finally {
      // Closed either way. On failure the reason is shown on the page
      // behind, where it stays readable instead of vanishing with the box.
      setDeleting(false)
      setPending(null)
    }
  }

  return (
    <div className="library">
      <div className="library-head">
        <div className="library-head-text">
          <h1 className="library-title">My VeggieBooks</h1>
          <p className="library-sub">
            {email ? `Signed in as ${email}` : 'Guest: your books are not saved'}
          </p>
        </div>
        <button
          type="button"
          className="library-account"
          onClick={email ? onAccount : onSignIn}
        >
          {email ? <GearIcon /> : <PersonIcon />}
          {email ? 'Account' : 'Sign in'}
        </button>
      </div>

      <div className="library-create">
        <button
          type="button"
          className="library-create-btn is-primary"
          onClick={onCreateVeggie}
        >
          <span className="library-create-icon">
            <PlusIcon />
          </span>
          <span className="library-create-label">Create New VeggieBook</span>
          <ChevronRightIcon className="library-create-chevron" />
        </button>

        {/* Not built yet. Stays disabled until the Secrets Book flow exists. */}
        <button type="button" className="library-create-btn is-secondary" disabled>
          <span className="library-create-icon">
            <LockIcon />
          </span>
          <span className="library-create-label">Create New Secrets Book</span>
          <ChevronRightIcon className="library-create-chevron" />
        </button>
      </div>

      {loading && (
        <div role="status" aria-busy="true">
          <span className="visually-hidden">Loading your books...</span>
          <ul className="library-books" aria-hidden="true">
            {Array.from({ length: SKELETON_CARDS }, (_, i) => (
              <li key={i}>
                <div className="skeleton library-skel-card" />
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="message">{error}</p>}
      {deleteError && <p className="message">{deleteError}</p>}

      {!loading && !error && books.length === 0 && (
        <p className="message">
          You have not made any books yet. Start with Create New VeggieBook.
        </p>
      )}

      <ul className="library-books">
        {books.map((book) => {
          const veg = book.vegetableCode ? byCode.get(book.vegetableCode) : undefined
          const name = veg?.name ?? 'VeggieBook'
          const bookName = veg ? `${veg.name} VeggieBook` : 'VeggieBook'
          const background = veg ? `cover/${veg.shortCode}.jpg` : null

          return (
            <li key={book.id} className="book-item">
              <BookCard
                title={name}
                background={background}
                cover={book.cover}
                subtitle="Recipes, tips and more"
                count={book.recipeCount}
                onClick={onViewBook ? () => onViewBook(book.id) : undefined}
              />

              <ActionMenu
                className="book-item-menu"
                label={`Options for your ${bookName}`}
                items={[
                  {
                    label: 'Delete book',
                    danger: true,
                    icon: 'trash',
                    onSelect: () => setPending({ id: book.id, name: bookName }),
                  },
                ]}
              />
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={pending !== null}
        title={`Delete ${pending?.name ?? 'this book'}?`}
        body="This action permanently deletes this book and cannot be undone."
        confirmLabel="Delete book"
        cancelLabel="Cancel"
        danger
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!deleting) setPending(null)
        }}
      />
    </div>
  )
}