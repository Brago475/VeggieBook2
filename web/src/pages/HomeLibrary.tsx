import { useState } from 'react'
import { SignOutIcon } from '../components/AccountIcons'
import { ActionMenu } from '../components/ActionMenu'
import { BookCard } from '../components/BookCard'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  ChevronRightIcon,
  GearIcon,
  InfoIcon,
  LockIcon,
  PersonIcon,
  PlusIcon,
} from '../components/LibraryIcons'
import { MainMenu, type MainMenuItem } from '../components/MainMenu'
import type { BookSummary, SecretCategory, Vegetable } from '../types'

// Home screen: a heading that says who is using the site, the two create
// buttons, then the books.
//
// Signed in, the books come from the account and are there on any device.
// For a guest, they are kept on the server in a temporary guest account,
// until the guest signs out or for up to 24 hours. The line under the
// heading says which, so a guest is never surprised.
//
// Beside the heading, the ☰ Menu (MainMenu.tsx). An account gets Account
// settings. A guest gets Create account, Sign in, and End guest visit, which
// asks first because it deletes their books. About VeggieBook is for
// everyone. Future features are added to its list, so the heading never
// gets more crowded.
//
// Each card follows the original app: a picture fills the card and the
// chosen cover sits as a small inset. For a VeggieBook the picture is the
// vegetable's; for a Secrets Book it is the category's (the toaster, the
// cart), as on the original app's home screen. Every card opens its book,
// for a guest as well as an account. Actions on a book live in the ⋮ on its
// card.
//
// While the books load, two gray card shapes hold their place, so the list
// does not pop in under a line of text.

type Props = {
  // The account's email, or null for a guest. Visitors who are neither see
  // Welcome instead of this screen.
  email: string | null
  books: BookSummary[]
  vegetables: Vegetable[]
  secretCategories: SecretCategory[]
  loading: boolean
  error: string | null
  onCreateVeggie: () => void
  onCreateSecrets: () => void
  onAccount: () => void
  onRegister: () => void
  onSignIn: () => void
  // Signs the guest out, which deletes the guest and their books.
  onEndGuest: () => Promise<void>
  onAbout: () => void
  onDeleteBook: (id: string) => Promise<void>
  onViewBook: (id: string) => void
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
  onRegister,
  onSignIn,
  onEndGuest,
  onAbout,
  onDeleteBook,
  onViewBook,
}: Props) {
  const isGuest = email === null

  const [deleteError, setDeleteError] = useState<string | null>(null)
  // The book awaiting confirmation. The name is held alongside the id so the
  // question can say which book, rather than "this book".
  const [pending, setPending] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // End guest visit, waiting for confirmation.
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [ending, setEnding] = useState(false)
  const [endError, setEndError] = useState<string | null>(null)

  const byCode = new Map<string, Vegetable>(vegetables.map((v) => [v.code, v]))
  const byCategory = new Map<number, SecretCategory>(
    secretCategories.map((c) => [c.id, c]),
  )

  // What the ☰ Menu offers. The first items depend on who is here; About is
  // for everyone. New features go at the end of this list.
  const menuItems: MainMenuItem[] = isGuest
    ? [
        { label: 'Create account', icon: <PlusIcon />, onSelect: onRegister },
        { label: 'Sign in', icon: <PersonIcon />, onSelect: onSignIn },
        { label: 'End guest visit', icon: <SignOutIcon />, onSelect: () => setConfirmEnd(true) },
        { label: 'About VeggieBook', icon: <InfoIcon />, onSelect: onAbout },
      ]
    : [
        { label: 'Account settings', icon: <GearIcon />, onSelect: onAccount },
        { label: 'About VeggieBook', icon: <InfoIcon />, onSelect: onAbout },
      ]

  function cardInfo(book: BookSummary): CardInfo {
    if (book.kind === 'secrets') {
      const category =
        book.secretCategoryId != null ? byCategory.get(book.secretCategoryId) : undefined
      return {
        title: category?.name ?? 'Secrets Book',
        bookName: category ? `${category.name} book` : 'Secrets Book',
        background: category?.image ?? null,
        subtitle: 'Secrets to better eating',
        countNoun: 'secret',
      }
    }

    const veg = book.vegetableCode ? byCode.get(book.vegetableCode) : undefined
    return {
      title: veg?.name ?? 'VeggieBook',
      bookName: veg ? `${veg.name} VeggieBook` : 'VeggieBook',
      background: veg ? `cover/${veg.shortCode}.jpg` : null,
      subtitle: 'Recipes, tips and more',
      countNoun: 'recipe',
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

  async function endGuestVisit() {
    if (ending) return
    setEnding(true)
    setEndError(null)
    try {
      await onEndGuest()
      // On success the parent shows Welcome.
    } catch (err) {
      setEndError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      )
      setEnding(false)
      setConfirmEnd(false)
    }
  }

  // "Delete these 3 books", so the guest knows exactly what they lose.
  const guestBooksLine =
    books.length === 0
      ? 'You have no books yet.'
      : books.length === 1
        ? 'This deletes your 1 book.'
        : `This deletes your ${books.length} books.`

  return (
    <div className="library">
      <div className="library-head">
        <div className="library-head-text">
          <h1 className="library-title">My VeggieBooks</h1>
          <p className="library-sub">
            {isGuest
              ? 'Guest: your books are kept until you sign out, for up to 24 hours'
              : `Signed in as ${email}`}
          </p>
        </div>
        <MainMenu items={menuItems} />
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
      {endError && <p className="message">{endError}</p>}

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
                onClick={() => onViewBook(book.id)}
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

      <ConfirmDialog
        open={confirmEnd}
        title="End your guest visit?"
        body={`${guestBooksLine} To keep them, choose Create account or Sign in instead.`}
        confirmLabel="End visit"
        cancelLabel="Cancel"
        danger
        busy={ending}
        onConfirm={endGuestVisit}
        onCancel={() => {
          if (!ending) setConfirmEnd(false)
        }}
      />
    </div>
  )
}