import { useState } from 'react'
import { BookCard } from '../components/library/BookCard'
import { BookSkeleton } from '../components/library/BookSkeleton'
import { CoverOptions } from '../components/veggie/CoverOptions'
import { NavBar } from '../components/layout/NavBar'
import { useBookDetail, type BookDetail } from '../hooks/useBookDetail'
import { useHeld } from '../hooks/useHeld'
import { BOOK } from '../i18n/strings/book'
import { FLOW } from '../i18n/strings/flow'
import { useStrings } from '../i18n/useStrings'
import type { Vegetable } from '../types'

// Changing a saved VeggieBook's cover, as the original app allowed. The
// same cover screen as the last step of making a book (CoverChooser): a
// live preview, then the three ways to set a cover. It starts on the
// book's current cover.
//
// SAVE COVER saves and returns to the book. CANCEL returns without a
// change. Saving the cover the book already has is not sent; it just
// returns.

type Props = {
  bookId: string
  vegetables: Vegetable[]
  // Throws with a message for the user if the cover cannot be saved.
  onSave: (cover: string) => Promise<void>
  onCancel: () => void
}

export function ChangeVeggieCover({ bookId, vegetables, onSave, onCancel }: Props) {
  const t = useStrings(BOOK)
  const { book, loading, error } = useBookDetail(bookId)
  const vegetable = vegetables.find((v) => v.code === book?.vegetableCode)
  const waiting = useHeld(loading || (book !== null && !vegetable && vegetables.length === 0))

  if (waiting) return <BookSkeleton />

  if (error || !book || !vegetable) {
    return (
      <div className="book-view">
        <p className="message book-view-message">{error ?? t.couldNotOpen}</p>
        <div className="book-view-back">
          <button type="button" className="link-btn" onClick={onCancel}>
            {t.backToBook}
          </button>
        </div>
      </div>
    )
  }

  // Mounted once the book is in, so the chosen cover can start on the
  // book's current one.
  return (
    <CoverEditor book={book} vegetable={vegetable} vegetables={vegetables} onSave={onSave} onCancel={onCancel} />
  )
}

type EditorProps = {
  book: BookDetail
  vegetable: Vegetable
  vegetables: Vegetable[]
  onSave: (cover: string) => Promise<void>
  onCancel: () => void
}

function CoverEditor({ book, vegetable, vegetables, onSave, onCancel }: EditorProps) {
  const t = useStrings(BOOK)
  const flow = useStrings(FLOW)
  const defaultCover = `cover/${vegetable.shortCode}.jpg`

  const [selected, setSelected] = useState(book.cover || defaultCover)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (uploading || saving) return
    if (selected === book.cover) {
      onCancel()
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(selected)
      // On success the parent returns to the book.
    } catch (err) {
      setError(err instanceof Error ? err.message : t.coverNotSaved)
      setSaving(false)
    }
  }

  return (
    <>
      <div className="intro-text">
        <p>{t.newCoverVeggie(vegetable.name)}</p>
      </div>

      <div className="cover-preview">
        <BookCard title={vegetable.name} background={defaultCover} cover={selected} />
      </div>

      <CoverOptions
        vegetable={vegetable}
        vegetables={vegetables}
        defaultCover={defaultCover}
        selected={selected}
        onSelect={setSelected}
        onBusy={setUploading}
      />

      {error && <p className="message">{error}</p>}

      <NavBar
        secondaryLabel={t.cancel}
        onSecondary={onCancel}
        primaryLabel={saving ? flow.saving : t.saveCover}
        onPrimary={save}
      />
    </>
  )
}