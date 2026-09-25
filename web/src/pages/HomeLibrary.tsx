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
import type { BookSummary, SecretCategory, Vegetable } from '../types'

// Home screen: a heading that says who is using the site, the two create
// buttons, then the books.
//
// Signed in, the books come from the account and are there on any device.
// For a guest, they are the books finished on this page, gone when it
// closes. The line under the heading says which, so a guest is never
// surprised.
//
// Each card follows the original app: a picture fills the card and the
// chosen cover sits as a small inset. For a VeggieBook the picture is the
// vegetable's; for a Secrets Book it is the category's (the toaster, the
// cart), as on the original app's home screen. A signed-in account can open
// a VeggieBook card to read its recipes. A guest's book has no id on the
// server, so onViewBook is not passed and its cards stay unclickable.
// Actions on a book live in the ⋮ on its card.
//
// Secrets Book cards do not open yet: the book viewer shows recipes only,
// so they wait for the Secrets viewer.
//
// While the books load, two gray card shapes hold their place, so the list
// does not pop in under a line of text.

type Props = {
  email: string | null
  books: BookSummary[]
  vegetables: Vegetable[]
  secretCategories: SecretCategory[]
  loading: boolean
  error: string | null
  onCreateVeggie: () => void
  onCreateSecrets: () => void
  onAccount: () => void
  onSignIn: () => void
  onDeleteBook: (id: string) => Promise<void>
  onViewBook?: (id: string) => void
}

const SKELETON_CARDS = 2

// What one card shows. Worked out per kind of book, so the list below
// draws both kinds the same way.
type CardInfo = {
  title: string
  // The name used in the ⋮ label and the delete question.
  bookName: string
  background: string | null
  subtitle: string
  countNoun: 'recipe' | 'secret'
  opens: boolean
}

export function HomeLibrary({
  email,
  books,
  vegetables,
  secretCategories,
  loading,
  error,
  onCreateVeggie,
  onCreateSecrets,
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
  const byCategory = new Map<number, SecretCategory>(
    secretCategories.map((c) => [c.id, c]),
  )

  function cardInfo(book: BookSummary): CardInfo {
    if (book.kind === 'secrets') {
      const category =
        book.secretCategoryId != null ? byCategory.get(book.secretCategoryId) : undefined
      const title = category?.name ?? 'Secrets Book'
      return {
        title,
        bookName: category ? `${category.name} book` : 'Secrets Book',
        background: category?.image ?? null,
        subtitle: 'Secrets to better eating',
        countNoun: 'secret',
        opens: false,
      }
    }

    const veg = book.vegetableCode ? byCode.get(book.vegetableCode) : undefined
    return {
      title: veg?.name ?? 'VeggieBook',
      bookName: veg ? `${veg.name} VeggieBook` : 'VeggieBook',
      background: veg ? `cover/${veg.shortCode}.jpg` : null,
      subtitle: 'Recipes, tips and more',
      countNoun: 'recipe',
      opens: true,
    }
  }

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

      {/* Both create buttons are the same green: the two kinds of book are
          equal choices, as in the original app. */}
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

        {/* The lock is the mockup's mark for Secrets, not a disabled state. */}
        <button
          type="button"
          className="library-create-btn is-primary"
          onClick={onCreateSecrets}
        >
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
          You have not made any books yet. Start with Create New VeggieBook or
          Create New Secrets Book.
        </p>
      )}

      <ul className="library-books">
        {books.map((book) => {
          const info = cardInfo(book)

          return (
            <li key={book.id} className="book-item">
              <BookCard
                title={info.title}
                background={info.background}
                cover={book.cover}
                subtitle={info.subtitle}
                count={book.recipeCount}
                countNoun={info.countNoun}
                onClick={
                  onViewBook && info.opens ? () => onViewBook(book.id) : undefined
                }
              />

              <ActionMenu
                className="book-item-menu"
                label={`Options for your ${info.bookName}`}
                items={[
                  {
                    label: 'Delete book',
                    danger: true,
                    icon: 'trash',
                    onSelect: () => setPending({ id: book.id, name: info.bookName }),
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