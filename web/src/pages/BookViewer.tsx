import { useState } from 'react'
import { NavBar } from '../components/NavBar'
import { useBookDetail } from '../hooks/useBookDetail'
import { useRecipeDetail } from '../hooks/useRecipeDetail'
import type { Vegetable } from '../types'
import { coverSrc } from '../utils/coverSrc'

// A saved book, opened from the home library.
//
// The book's recipes are listed by title. Tapping one opens its full
// content, the same detail the review step shows. Back from a recipe
// returns to the list; back from the list leaves the book.
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

  const { detail, error: detailError } = useRecipeDetail(openRecipe)

  const vegetableName =
    vegetables.find((v) => v.code === book?.vegetableCode)?.name ?? ''

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
              <img
                className="recipe-photo"
                src={coverSrc(detail.photos[0])}
                alt=""
                loading="lazy"
              />
            )}
                        <p className="field-hint">
              Prep {detail.timeToPrepare} &middot; Cook {detail.timeToCook}{' '}
              &middot; Serves {detail.servings}
            </p>

            <h3>Ingredients</h3>
            <ul>
              {detail.ingredients.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>

            <h3>Steps</h3>
            <ol>
              {detail.steps.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          </article>
        )}

        <NavBar primaryLabel="BACK TO BOOK" onPrimary={() => setOpenRecipe(null)} />
      </>
    )
  }

  // The book's recipe list.
  return (
    <>
      <div className="intro-text">
        <p>Your {vegetableName} VeggieBook</p>
      </div>

      {book.cover && (
        <div className="cover-preview">
          <img src={coverSrc(book.cover)} alt="" />
        </div>
      )}

      <p className="field-hint">
        {book.recipes.length} {book.recipes.length === 1 ? 'recipe' : 'recipes'}
      </p>

      <ul className="book-recipes">
        {book.recipes.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className="cover-mode"
              onClick={() => setOpenRecipe(r.id)}
            >
              {r.title}
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