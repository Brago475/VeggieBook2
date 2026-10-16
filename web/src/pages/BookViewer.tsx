import { useEffect, useRef, useState } from 'react'
import { ActionMenu, type ActionMenuItem } from '../components/common/ActionMenu'
import { BookCard } from '../components/library/BookCard'
import { BookHeading } from '../components/library/BookHeading'
import { BookSkeleton } from '../components/library/BookSkeleton'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { NavBar } from '../components/layout/NavBar'
import { RecipeSections } from '../components/veggie/RecipeSections'
import { RecipeSkeleton } from '../components/veggie/RecipeSkeleton'
import { SafeImage } from '../components/common/SafeImage'
import { useBookDetail } from '../hooks/useBookDetail'
import { useHeld } from '../hooks/useHeld'
import { useRecipeDetail } from '../hooks/useRecipeDetail'
import { BOOK } from '../i18n/strings/book'
import { COMMON } from '../i18n/strings/common'
import { HOME } from '../i18n/strings/home'
import { useStrings } from '../i18n/useStrings'
import type { Vegetable } from '../types'
import { coverSrc } from '../utils/coverSrc'
import { downloadPdf, printPdf } from '../utils/bookPdf'

// A saved book, opened from the home library.
//
// The book's recipes are listed as cards: a photo, a title and a chevron.
// Tapping one opens its full content through RecipeSections, the same
// component the review step uses, so a recipe reads the same in both
// places. Coming back, by either Back button, returns to the same place in
// the list.
//
// Which recipe is open is held by App rather than here, so the Back button
// in the green header can close a recipe before it leaves the book.
//
// Actions live in ⋮ menus: on the cover card, Change cover, Print book,
// Download book and Delete book; on each recipe, Print recipe, Download
// recipe and Delete recipe. The last recipe cannot be deleted, since a book
// cannot be left empty; deleting the book covers that case.
//
// While the book or a recipe loads, a skeleton of its shape shows, held
// long enough to be seen (useHeld).

type Props = {
  bookId: string
  vegetables: Vegetable[]
  // The recipe open inside the book, or null while the list is showing.
  openRecipe: number | null
  onOpenRecipe: (id: number | null) => void
  onClose: () => void
  // Opens the change-cover screen for this book.
  onChangeCover: () => void
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
  onChangeCover,
  onDelete,
  onChanged,
}: Props) {
  const t = useStrings(BOOK)
  const home = useStrings(HOME)
  const common = useStrings(COMMON)

  const { book, loading, error, removeRecipe } = useBookDetail(bookId)
  const { detail, error: detailError } = useRecipeDetail(openRecipe)
  const bookLoading = useHeld(loading)
  const recipeLoading = useHeld(openRecipe !== null && !detail && !detailError)

  // What the confirm dialog is asking about, or null when it is closed.
  const [pending, setPending] = useState<Pending | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Where the list was scrolled when a recipe was opened.
  const listScroll = useRef(0)

  // When a recipe closes, put the list back where it was, after it renders.
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
  const bookName = vegetableName ? home.veggieBookName(vegetableName) : home.veggieBook

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
      // Shown on the page behind the dialog, where it stays readable.
      setActionError(err instanceof Error ? err.message : common.somethingWrong)
    }
    setBusy(false)
    setPending(null)
  }

  if (bookLoading) return <BookSkeleton />

  // Same off-white page as the book, with a plain way back to the library.
  if (error || !book) {
    return (
      <div className="book-view">
        <p className="message book-view-message">{error ?? t.couldNotOpen}</p>
        <div className="book-view-back">
          <button type="button" className="link-btn" onClick={onClose}>
            {t.backToBooks}
          </button>
        </div>
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
        {recipeLoading && <RecipeSkeleton />}
        {!recipeLoading && detailError && <p className="message">{t.recipeNotLoaded}</p>}

        {!recipeLoading && detail && (
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
        <NavBar primaryLabel={t.backToBookButton} onPrimary={() => onOpenRecipe(null)} />
      </>
    )
  }

  const canRemoveRecipe = book.recipes.length > 1

  function recipeItems(id: number, title: string): ActionMenuItem[] {
    const items: ActionMenuItem[] = [
      {
        label: t.printRecipe,
        icon: 'print',
        onSelect: () => printPdf({ bookId, recipeId: id }),
      },
      {
        label: t.downloadRecipe,
        icon: 'download',
        onSelect: () => downloadPdf({ bookId, recipeId: id }),
      },
    ]
    if (canRemoveRecipe) {
      items.push({
        label: t.deleteRecipe,
        danger: true,
        icon: 'trash',
        onSelect: () => setPending({ kind: 'recipe', id, title }),
      })
    }
    return items
  }

  // The book's recipe list.
  return (
    <div className="book-view">
      {/* Logo, a small "YOUR", then the book's name. */}
      <BookHeading title={bookName} />

      {/* The same card the home screen and the cover chooser show, with the
          small "VEGGIEBOOK" label and the book's ⋮ in its corner. */}
      <div className="cover-preview">
        <div className="book-hero">
          <BookCard
            title={vegetableName}
            background={vegetableShortCode ? `cover/${vegetableShortCode}.jpg` : null}
            cover={book.cover}
            label={t.veggieLabel}
          />
          <ActionMenu
            className="book-item-menu"
            label={home.options(bookName)}
            items={[
              {
                label: t.changeCover,
                icon: 'image',
                onSelect: onChangeCover,
              },
              {
                label: t.printBook,
                icon: 'print',
                onSelect: () => printPdf({ bookId }),
              },
              {
                label: t.downloadBook,
                icon: 'download',
                onSelect: () => downloadPdf({ bookId }),
              },
              {
                label: home.deleteBook,
                danger: true,
                icon: 'trash',
                onSelect: () => setPending({ kind: 'book' }),
              },
            ]}
          />
        </div>
      </div>

      {/* A chip for a fact about the book, on its own tint under the cover. */}
      <p className="book-count">
        <span className="book-count-pill">{common.items(book.recipes.length, 'recipe')}</span>
      </p>

      {actionError && <p className="message">{actionError}</p>}

      <ul className="book-recipes">
        {book.recipes.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className="recipe-row has-menu"
              onClick={() => openRecipeAt(r.id)}
            >
              {/* No photo, or one that will not load, shows the VeggieBook mark. */}
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

            {/* A sibling of the row, so tapping ⋮ never opens the recipe. */}
            <ActionMenu
              className="recipe-row-menu"
              label={t.optionsFor(r.title)}
              items={recipeItems(r.id, r.title)}
            />
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pending !== null}
        title={t.deleteNamed(pending?.kind === 'recipe' ? pending.title : bookName)}
        body={pending?.kind === 'recipe' ? t.removeRecipeBody : home.deleteBody}
        confirmLabel={pending?.kind === 'recipe' ? t.deleteRecipe : home.deleteBook}
        cancelLabel={common.cancel}
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