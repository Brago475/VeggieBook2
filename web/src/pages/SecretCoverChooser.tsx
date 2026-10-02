import { useState } from 'react'
import { BookCard } from '../components/library/BookCard'
import { NavBar } from '../components/layout/NavBar'
import { SecretCoverOptions } from '../components/secrets/SecretCoverOptions'
import type { SecretCategory } from '../types'

// Last screen of a Secrets Book: pick the cover, then save the book.
// The Secrets counterpart of CoverChooser, with the same preview, the same
// three cover options, and the same button, so both kinds of book end the
// same way.
//
// The preview is the card the home screen will show: the category's
// picture fills it, with the chosen cover as the inset.
//
// Everyone who reaches this screen is a guest or an account, and both save
// to the server, so SAVE BOOK is the only way to finish.

type Props = {
  categories: SecretCategory[]
  categoryId: number
  categoryName: string
  categoryImage: string
  // The first kept secret's picture, selected on arrival.
  defaultCover: string
  // Throws with a message for the user if the book cannot be saved.
  onSave: (cover: string) => Promise<void>
}

export function SecretCoverChooser({
  categories,
  categoryId,
  categoryName,
  categoryImage,
  defaultCover,
  onSave,
}: Props) {
  const [selected, setSelected] = useState(defaultCover)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (uploading || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave(selected)
      // On success the parent moves on to the home screen.
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Your book could not be saved. Please try again.',
      )
      setSaving(false)
    }
  }

  return (
    <>
      <div className="intro-text">
        <p>Choose a cover for your {categoryName} book.</p>
      </div>

      <div className="cover-preview">
        <BookCard title={categoryName} background={categoryImage} cover={selected} />
      </div>

      <SecretCoverOptions
        categories={categories}
        categoryId={categoryId}
        defaultCover={defaultCover}
        selected={selected}
        onSelect={setSelected}
        onBusy={setUploading}
      />

      {error && <p className="message">{error}</p>}

      <NavBar primaryLabel={saving ? 'SAVING...' : 'SAVE BOOK'} onPrimary={save} />
    </>
  )
}