import { useState } from 'react'
import { BookCard } from '../components/BookCard'
import { BookSkeleton } from '../components/BookSkeleton'
import { CoverOptions } from '../components/CoverOptions'
import { NavBar } from '../components/NavBar'
import { useBookDetail, type BookDetail } from '../hooks/useBookDetail'
import type { Vegetable } from '../types'

// Changing a saved VeggieBook's cover, as the original app allowed. The
// same cover screen as the last step of making a book (CoverChooser):
// a live preview, then the three ways to set a cover. It starts on the
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
  const { book, loading, error } = useBookDetail(bookId)
  const vegetable = vegetables.find((v) => v.code === book?.vegetableCode)

  if (loading || (book && !vegetable && vegetables.length === 0)) return <BookSkeleton />

  if (error || !book || !vegetable) {
    return (
      <div className="book-view">
        <p className="message book-view-message">
          {error ?? 'Could not open this book.'}
        </p>
        <div className="book-view-back">
          <button type="button" className="link-btn" onClick={onCancel}>
            Back to the book
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
      setError(
        err instanceof Error ? err.message : 'The cover could not be saved. Please try again.',
      )
      setSaving(false)
    }
  }

  return (
    <>
      <div className="intro-text">
        <p>Choose a new cover for your {vegetable.name} VeggieBook.</p>
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
        secondaryLabel="CANCEL"
        onSecondary={onCancel}
        primaryLabel={saving ? 'SAVING...' : 'SAVE COVER'}
        onPrimary={save}
      />
    </>
  )
}