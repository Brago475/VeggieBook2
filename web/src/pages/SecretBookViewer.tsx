import { useEffect, useRef, useState } from 'react'
import { ActionMenu } from '../components/ActionMenu'
import { BookCard } from '../components/BookCard'
import { BookHeading } from '../components/BookHeading'
import { BookSkeleton } from '../components/BookSkeleton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { NavBar } from '../components/NavBar'
import { SafeImage } from '../components/SafeImage'
import { SecretCard } from '../components/SecretCard'
import { useSecretBook } from '../hooks/useSecretBook'
import { coverSrc } from '../utils/coverSrc'

// A saved Secrets Book, opened from the home library. The Secrets
// counterpart of BookViewer, built from the same pieces so both kinds of
// book look and behave the same.
//
// The book's secrets are listed as rows: a picture, a title and a chevron.
// Tapping one opens it in SecretCard, the same component the review step
// uses, so a secret reads the same in both places. Coming back, by either
// Back button, returns to the same place in the list.
//
// Which secret is open is held by App rather than here, so the Back button
// in the green header can close a secret before it leaves the book.
//
// Changes live in ⋮ menus: on the cover card, Change cover and Delete
// book; on each secret, Delete secret. The last secret has no menu, since
// a book cannot be left empty; deleting the book covers that case.
//
// While the book loads, the book skeleton shows, so the screen is never a
// blank page or a lone line of text.

type Props = {
  bookId: string
  // The secret open inside the book, or null while the list is showing.
  openSecret: number | null
  onOpenSecret: (id: number | null) => void
  onClose: () => void
  // Opens the change-cover screen for this book.
  onChangeCover: () => void
  // Throws with a message for the user if the book cannot be deleted.
  onDelete: (id: string) => Promise<void>
  // Called after a secret is taken out, so the count on the home screen is
  // current when the user goes back.
  onChanged: () => void
}

type Pending = { kind: 'book' } | { kind: 'secret'; id: number; title: string }

export function SecretBookViewer({
  bookId,
  openSecret,
  onOpenSecret,
  onClose,
  onChangeCover,
  onDelete,
  onChanged,
}: Props) {
  const { book, category, secrets, loading, error, removeSecret } = useSecretBook(bookId)

  // What the confirm dialog is asking about, or null when it is closed.
  const [pending, setPending] = useState<Pending | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Where the list was scrolled when a secret was opened.
  const listScroll = useRef(0)

  // When a secret closes, by the header's Back or the one at the bottom,
  // put the list back where it was. After the list renders, not before.
  const wasOpen = useRef(openSecret !== null)
  useEffect(() => {
    const isOpen = openSecret !== null
    if (wasOpen.current && !isOpen) {
      const y = listScroll.current
      requestAnimationFrame(() => window.scrollTo(0, y))
    }
    wasOpen.current = isOpen
  }, [openSecret])

  const categoryName = category?.name ?? 'Secrets'
  const bookName = `${categoryName} book`

  function openSecretAt(id: number) {
    listScroll.current = window.scrollY
    onOpenSecret(id)
    window.scrollTo(0, 0)
  }

  async function confirm() {
    if (!pending || busy) return
    setBusy(true)
    setActionError(null)
    try {
      if (pending.kind === 'book') {
        await onDelete(bookId)
        // On success the parent returns to the home screen.
        return
      }
      await removeSecret(pending.id)
      onChanged()
    } catch (err) {
      // Shown on the page behind the dialog, where it stays readable
      // instead of vanishing when the dialog closes.
      setActionError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      )
    }
    setBusy(false)
    setPending(null)
  }

  if (loading) return <BookSkeleton />

  // Same off-white page as the book, so a missing book does not flash to a
  // white screen, with a plain way back to the library under the message.
  if (error || !book || !category) {
    return (
      <div className="book-view">
        <p className="message book-view-message">
          {error ?? 'Could not open this book.'}
        </p>
        <div className="book-view-back">
          <button type="button" className="link-btn" onClick={onClose}>
            Back to my books
          </button>
        </div>
      </div>
    )
  }

  // One secret, opened from the list.
  if (openSecret !== null) {
    const secret = secrets.find((s) => s.id === openSecret)

    return (
      <>
        {secret ? (
          <SecretCard
            secret={secret}
            categoryName={category.name}
            categoryColor={category.color}
          />
        ) : (
          <p className="message">This secret is no longer in this book.</p>
        )}

        {/* Kept alongside the header's Back: after scrolling through a long
            secret, this is the one within reach. */}
        <NavBar primaryLabel="BACK TO BOOK" onPrimary={() => onOpenSecret(null)} />
      </>
    )
  }

  const canRemoveSecret = secrets.length > 1

  // The book's list of secrets.
  return (
    <div className="book-view">
      {/* Logo, a small "YOUR", then the book's name. */}
      <BookHeading title={category.name} />

      {/* The same card the home screen and the cover chooser show, so a
          book looks the same wherever it appears. Here it also carries the
          small "SECRETS BOOK" label, and the book's ⋮ in its corner. */}
      <div className="cover-preview">
        <div className="book-hero">
          <BookCard
            title={category.name}
            background={category.image}
            cover={book.cover}
            label="Secrets Book"
          />
          <ActionMenu
            className="book-item-menu"
            label={`Options for your ${bookName}`}
            items={[
              {
                label: 'Change cover',
                icon: 'image',
                onSelect: onChangeCover,
              },
              {
                label: 'Delete book',
                danger: true,
                icon: 'trash',
                onSelect: () => setPending({ kind: 'book' }),
              },
            ]}
          />
        </div>
      </div>

      <p className="book-count">
        <span className="book-count-pill">
          {secrets.length} {secrets.length === 1 ? 'secret' : 'secrets'}
        </span>
      </p>

      {actionError && <p className="message">{actionError}</p>}

      <ul className="book-recipes">
        {secrets.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={`recipe-row${canRemoveSecret ? ' has-menu' : ''}`}
              onClick={() => openSecretAt(s.id)}
            >
              {/* The pictures have words drawn into them, so the thumbnail
                  shows the whole picture (secrets.css) instead of a crop. */}
              <SafeImage
                className="recipe-thumb secret-thumb"
                src={s.image ? coverSrc(s.image) : null}
              />
              <span className="recipe-row-title">{s.headline}</span>
              <svg
                className="recipe-row-chevron"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M9 5l7 7-7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* A sibling of the row, not inside it, so tapping ⋮ never
                opens the secret. */}
            {canRemoveSecret && (
              <ActionMenu
                className="recipe-row-menu"
                label={`Options for ${s.headline}`}
                items={[
                  {
                    label: 'Delete secret',
                    danger: true,
                    icon: 'trash',
                    onSelect: () =>
                      setPending({ kind: 'secret', id: s.id, title: s.headline }),
                  },
                ]}
              />
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pending !== null}
        title={
          pending?.kind === 'secret'
            ? `Delete "${pending.title}"?`
            : `Delete ${bookName}?`
        }
        body={
          pending?.kind === 'secret'
            ? 'This removes the secret from this book. It cannot be undone.'
            : 'This action permanently deletes this book and cannot be undone.'
        }
        confirmLabel={pending?.kind === 'secret' ? 'Delete secret' : 'Delete book'}
        cancelLabel="Cancel"
        danger
        busy={busy}
        onConfirm={confirm}
        onCancel={() => {
          if (!busy) setPending(null)
        }}
      />
    </div>
  )
}