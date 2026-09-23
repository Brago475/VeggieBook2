import { useRef, useState } from 'react'
import { BookCard } from '../components/BookCard'
import { BookHeading } from '../components/BookHeading'
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
// places. Coming back returns to the same place in the list, so working
// through a long book does not mean scrolling from the top each time.
//
// Read only. A book's recipes and cover are fixed once it is saved; the
// only change available here is deleting the whole book.

type Props = {
  bookId: string
  vegetables: Vegetable[]
  onClose: () => void
  // Throws with a message for the user if the book cannot be deleted.
  onDelete: (id: string) => Promise<void>
}

export function BookViewer({ bookId, vegetables, onClose, onDelete }: Props) {
  const { book, loading, error } = useBookDetail(bookId)
  const [openRecipe, setOpenRecipe] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Where the list was scrolled when a recipe was opened, so closing the
  // recipe puts the user back where they were.
  const listScroll = useRef(0)

  const { detail, error: detailError } = useRecipeDetail(openRecipe)

  const vegetable = vegetables.find((v) => v.code === book?.vegetableCode)
  const vegetableName = vegetable?.name ?? ''
  const vegetableShortCode = vegetable?.shortCode ?? ''

  function openRecipeAt(id: number) {
    listScroll.current = window.scrollY
    setOpenRecipe(id)
    window.scrollTo(0, 0)
  }

  function closeRecipe() {
    setOpenRecipe(null)
    // After the list renders again, not before.
    requestAnimationFrame(() => window.scrollTo(0, listScroll.current))
  }

  async function remove() {
    if (deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await onDelete(bookId)
      // On success the parent returns to the home screen.
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : 'This book could not be deleted. Please try again.',
      )
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <>
        <p className="message">Opening your book...</p>
        <NavBar primaryLabel="BACK" onPrimary={onClose} />
      </>
    )
  }

  if (error || !book) {
    return (
      <>
        <p className="message">{error ?? 'Could not open this book.'}</p>
        <NavBar primaryLabel="BACK" onPrimary={onClose} />
      </>
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

        <NavBar primaryLabel="BACK TO BOOK" onPrimary={closeRecipe} />
      </>
    )
  }

  // The book's recipe list.
  return (
    <div className="book-view">
      {/* Logo, a small "YOUR", then the book's name. */}
      <BookHeading title={`${vegetableName} VeggieBook`} />

      {/* The same card the home screen and the cover chooser show, so a
          book looks the same wherever it appears. Here it also carries the
          small "VEGGIEBOOK" label under the name. */}
      <div className="cover-preview">
        <BookCard
          title={vegetableName}
          background={vegetableShortCode ? `cover/${vegetableShortCode}.jpg` : null}
          cover={book.cover}
          label="VeggieBook"
        />
      </div>

      {/* A chip rather than a line of gray text: it is a fact about the
          book, so it sits on its own tint under the cover instead of
          trailing off the corner of the card. */}
      <p className="book-count">
        <span className="book-count-pill">
          {book.recipes.length} {book.recipes.length === 1 ? 'recipe' : 'recipes'}
        </span>
      </p>

      <ul className="book-recipes">
        {book.recipes.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className="recipe-row"
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
          </li>
        ))}
      </ul>

      {deleteError && <p className="message">{deleteError}</p>}

      <div className="account-page">
        {confirming ? (
          <>
            <p className="field-hint account-center">
              Delete this book? This cannot be undone.
            </p>
            <button
              type="button"
              className="link-btn"
              onClick={remove}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Yes, delete it'}
            </button>
            <button
              type="button"
              className="link-btn"
              onClick={() => setConfirming(false)}
              disabled={deleting}
            >
              Keep it
            </button>
          </>
        ) : (
          <button
            type="button"
            className="link-btn"
            onClick={() => setConfirming(true)}
          >
            Delete this book
          </button>
        )}
      </div>

      <NavBar primaryLabel="BACK" onPrimary={onClose} />
    </div>
  )
}