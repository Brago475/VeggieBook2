import { useRef, useState } from 'react'
import { BookCard } from '../components/BookCard'
import { NavBar } from '../components/NavBar'
import { SafeImage } from '../components/SafeImage'
import { useBookDetail } from '../hooks/useBookDetail'
import { useRecipeDetail } from '../hooks/useRecipeDetail'
import type { Vegetable } from '../types'
import { coverSrc } from '../utils/coverSrc'

// A saved book, opened from the home library.
//
// The book's recipes are listed as a photo and a title. Tapping one opens
// its full content, the same detail the review step shows. Coming back
// returns to the same place in the list, so working through a long book
// does not mean scrolling from the top each time.
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
    return (
      <>
        {!detail && !detailError && <p className="message">Loading recipe...</p>}
        {detailError && <p className="message">This recipe could not be loaded.</p>}

        {detail && (
          <article className="recipe-detail">
            <h2>{detail.title}</h2>

            {detail.photos.length > 0 && (
              <SafeImage
                className="recipe-photo"
                src={coverSrc(detail.photos[0])}
              />
            )}

            <p className="recipe-facts">
              Prep {detail.timeToPrepare} &middot; Cook {detail.timeToCook}{' '}
              &middot; Serves {detail.servings}
            </p>

            <h3>Ingredients</h3>
            <ul className="book-ingredients">
              {detail.ingredients.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>

            <h3>Steps</h3>
            <ol className="book-steps">
              {detail.steps.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          </article>
        )}

        <NavBar primaryLabel="BACK TO BOOK" onPrimary={closeRecipe} />
      </>
    )
  }

  // The book's recipe list.
  return (
    <>
      <div className="intro-text">
        <p>Your {vegetableName} VeggieBook</p>
      </div>

      {/* The same card the home screen and the cover chooser show, so a
          book looks the same wherever it appears. */}
      <div className="cover-preview">
        <BookCard
          title={vegetableName}
          background={vegetableShortCode ? `cover/${vegetableShortCode}.jpg` : null}
          cover={book.cover}
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
    </>
  )
}