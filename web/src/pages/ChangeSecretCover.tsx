import { useState } from 'react'
import { BookCard } from '../components/library/BookCard'
import { BookSkeleton } from '../components/library/BookSkeleton'
import { NavBar } from '../components/layout/NavBar'
import { SecretCoverOptions } from '../components/secrets/SecretCoverOptions'
import { useHeld } from '../hooks/useHeld'
import { useSecretBook, type SavedSecretsBook } from '../hooks/useSecretBook'
import { BOOK } from '../i18n/strings/book'
import { FLOW } from '../i18n/strings/flow'
import { useStrings } from '../i18n/useStrings'
import type { CategorySecrets, Secret, SecretCategory } from '../types'

// Changing a saved Secrets Book's cover, as the original app allowed. The
// Secrets counterpart of ChangeVeggieCover, and the same cover screen as
// the last step of making a Secrets Book (SecretCoverChooser). It starts
// on the book's current cover.
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
  const t = useStrings(BOOK)
  const { book, category, secrets, loading, error } = useSecretBook(bookId)
  const waiting = useHeld(loading)

  if (waiting) return <BookSkeleton />

  if (error || !book || !category) {
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
  const t = useStrings(BOOK)
  const flow = useStrings(FLOW)
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
      setError(err instanceof Error ? err.message : t.coverNotSaved)
      setSaving(false)
    }
  }

  return (
    <>
      <div className="intro-text">
        <p>{t.newCoverSecrets(category.name)}</p>
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
        secondaryLabel={t.cancel}
        onSecondary={onCancel}
        primaryLabel={saving ? flow.saving : t.saveCover}
        onPrimary={save}
      />
    </>
  )
}