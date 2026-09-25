import { useState } from 'react'
import { BookCard } from '../components/BookCard'
import { BookSkeleton } from '../components/BookSkeleton'
import { NavBar } from '../components/NavBar'
import { SecretCoverOptions } from '../components/SecretCoverOptions'
import { useSecretBook, type SavedSecretsBook } from '../hooks/useSecretBook'
import type { CategorySecrets, Secret, SecretCategory } from '../types'

// Changing a saved Secrets Book's cover, as the original app allowed. The
// Secrets counterpart of ChangeVeggieCover, and the same cover screen as
// the last step of making a Secrets Book (SecretCoverChooser): a live
// preview, then the three ways to set a cover. It starts on the book's
// current cover.
//
// "Use default cover" is the book's first secret that has a picture, the
// same default the book was made with.
//
// SAVE COVER saves and returns to the book. CANCEL returns without a
// change. Saving the cover the book already has is not sent; it just
// returns.

type Props = {
  bookId: string
  categories: SecretCategory[]
  // Throws with a message for the user if the cover cannot be saved.
  onSave: (cover: string) => Promise<void>
  onCancel: () => void
}

export function ChangeSecretCover({ bookId, categories, onSave, onCancel }: Props) {
  const { book, category, secrets, loading, error } = useSecretBook(bookId)

  if (loading) return <BookSkeleton />

  if (error || !book || !category) {
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
    <CoverEditor
      book={book}
      category={category}
      secrets={secrets}
      categories={categories}
      onSave={onSave}
      onCancel={onCancel}
    />
  )
}

type EditorProps = {
  book: SavedSecretsBook
  category: CategorySecrets['category']
  secrets: Secret[]
  categories: SecretCategory[]
  onSave: (cover: string) => Promise<void>
  onCancel: () => void
}

function CoverEditor({ book, category, secrets, categories, onSave, onCancel }: EditorProps) {
  const defaultCover =
    secrets.map((s) => s.image).find((image): image is string => Boolean(image)) ??
    book.cover

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
        <p>Choose a new cover for your {category.name} book.</p>
      </div>

      <div className="cover-preview">
        <BookCard title={category.name} background={category.image} cover={selected} />
      </div>

      <SecretCoverOptions
        categories={categories}
        categoryId={category.id}
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