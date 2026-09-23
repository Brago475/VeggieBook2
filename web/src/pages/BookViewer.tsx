import { useEffect, useRef, useState } from 'react'
import { ActionMenu } from '../components/ActionMenu'
import { BookCard } from '../components/BookCard'
import { BookHeading } from '../components/BookHeading'
import { BookSkeleton } from '../components/BookSkeleton'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { NavBar } from '../components/NavBar'
import { RecipeSections } from '../components/RecipeSections'
import { SafeImage } from '../components/SafeImage'
import { useBookDetail } from '../hooks/useBookDetail'
import { useRecipeDetail } from '../hooks/useRecipeDetail'
import type { Vegetable } from '../types'
import { coverSrc } from '../utils/coverSrc'

// A saved book, opened from the home library.
//
// The book's recipes are listed as cards: a photo, a title and a chevron.
// Tapping one opens its full content through RecipeSections, the same
// component the review step uses, so a recipe reads the same in both
// places. Coming back, by either Back button, returns to the same place in
// the list, so working through a long book does not mean scrolling from
// the top each time.
//
// Which recipe is open is held by App rather than here, so the Back button
// in the green header can close a recipe before it leaves the book.
//
// Changes live in ⋮ menus: on the cover card, Delete book; on each recipe,
// Delete recipe. The last recipe has no menu, since a book cannot be left
// empty; deleting the book covers that case.
//
// While the book loads, BookSkeleton shows its shape, so the screen is
// never a blank page.

type Props = {
  bookId: string
  vegetables: Vegetable[]
  // The recipe open inside the book, or null while the list is showing.
  openRecipe: number | null
  onOpenRecipe: (id: number | null) => void
  onClose: () => void
  // Throws with a message for the user if the book cannot be deleted.
  onDelete: (id: string) => Promise<void>
  // Called after a recipe is taken out, so the recipe count on the home
  // screen is current when the user goes back.
  onChanged: () => void
}

type Pending = { kind: 'book' } | { kind: 'recipe'; id: number; title: string }

export function BookViewer({
  bookId,
  vegetables,
  openRecipe,
  onOpenRecipe,
  onClose,
  onDelete,
  onChanged,
}: Props) {
  const { book, loading, error, removeRecipe } = useBookDetail(bookId)
  const { detail, error: detailError } = useRecipeDetail(openRecipe)

  // What the confirm dialog is asking about, or null when it is closed.
  const [pending, setPending] = useState<Pending | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Where the list was scrolled when a recipe was opened.
  const listScroll = useRef(0)

  // When a recipe closes, by the header's Back or the one at the bottom,
  // put the list back where it was. After the list renders, not before.
  const wasOpen = useRef(openRecipe !== null)
  useEffect(() => {
    const isOpen = openRecipe !== null
    if (wasOpen.current && !isOpen) {
      const y = listScroll.current
      requestAnimationFrame(() => window.scrollTo(0, y))
    }
    wasOpen.current = isOpen
  }, [openRecipe])

  const vegetable = vegetables.find((v) => v.code === book?.vegetableCode)
  const vegetableName = vegetable?.name ?? ''
  const vegetableShortCode = vegetable?.shortCode ?? ''
  const bookName = `${vegetableName} VeggieBook`

  function openRecipeAt(id: number) {
    listScroll.current = window.scrollY
    onOpenRecipe(id)
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
      await removeRecipe(pending.id)
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
  // white screen. The header's Back returns home.
  if (error || !book) {
    return (
      <div className="book-view">
        <p className="message book-view-message">
          {error ?? 'Could not open this book.'}
        </p>
      </div>
    )
  }

  // One recipe, opened from the list.
  if (openRecipe !== null) {
    // The first photo shows large at the top; RecipeSections puts any
    // others in Photos at the bottom and leaves this one out.
    const topPhoto = detail?.photos[0] ?? null

    return (
      <>
        {!detail && !detailError && <p className="message">Loading recipe...</p>}
        {detailError && <p className="message">This recipe could not be loaded.</p>}

        {detail && (
          <article className="recipe-detail">
            <h2>{detail.title}</h2>

            {topPhoto && (
              <SafeImage className="recipe-photo" src={coverSrc(topPhoto)} />
            )}

            <RecipeSections detail={detail} topPhoto={topPhoto} />
          </article>
        )}

        {/* Kept alongside the header's Back: after scrolling through a long
            recipe, this is the one within reach. */}
        <NavBar primaryLabel="BACK TO BOOK" onPrimary={() => onOpenRecipe(null)} />
      </>
    )
  }

  const canRemoveRecipe = book.recipes.length > 1

  // The book's recipe list.
  return (
    <div className="book-view">
      {/* Logo, a small "YOUR", then the book's name. */}
      <BookHeading title={bookName} />

      {/* The same card the home screen and the cover chooser show, so a
          book looks the same wherever it appears. Here it also carries the
          small "VEGGIEBOOK" label, and the book's ⋮ in its corner. */}
      <div className="cover-preview">
        <div className="book-hero">
          <BookCard
            title={vegetableName}
            background={vegetableShortCode ? `cover/${vegetableShortCode}.jpg` : null}
            cover={book.cover}
            label="VeggieBook"
          />
          <ActionMenu
            className="book-item-menu"
            label={`Options for your ${bookName}`}
            items={[
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

      {/* A chip rather than a line of gray text: it is a fact about the
          book, so it sits on its own tint under the cover instead of
          trailing off the corner of the card. */}
      <p className="book-count">
        <span className="book-count-pill">
          {book.recipes.length} {book.recipes.length === 1 ? 'recipe' : 'recipes'}
        </span>
      </p>

      {actionError && <p className="message">{actionError}</p>}

      <ul className="book-recipes">
        {book.recipes.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className={`recipe-row${canRemoveRecipe ? ' has-menu' : ''}`}
              onClick={() => openRecipeAt(r.id)}
            >
              {/* No photo row, or a photo that will not load, both land on
                  the VeggieBook mark rather than a stand-in photograph. */}
              <SafeImage
                className="recipe-thumb"
                src={r.photo ? coverSrc(r.photo) : null}
              />
              <span className="recipe-row-title">{r.title}</span>
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
                opens the recipe. */}
            {canRemoveRecipe && (
              <ActionMenu
                className="recipe-row-menu"
                label={`Options for ${r.title}`}
                items={[
                  {
                    label: 'Delete recipe',
                    danger: true,
                    icon: 'trash',
                    onSelect: () =>
                      setPending({ kind: 'recipe', id: r.id, title: r.title }),
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
          pending?.kind === 'recipe'
            ? `Delete ${pending.title}?`
            : `Delete ${bookName}?`
        }
        body={
          pending?.kind === 'recipe'
            ? 'This removes the recipe from this book. It cannot be undone.'
            : 'This action permanently deletes this book and cannot be undone.'
        }
        confirmLabel={pending?.kind === 'recipe' ? 'Delete recipe' : 'Delete book'}
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