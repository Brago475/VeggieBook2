import { useState } from 'react'
import { BookCard } from '../components/library/BookCard'
import { CoverOptions } from '../components/veggie/CoverOptions'
import { NavBar } from '../components/layout/NavBar'
import type { Vegetable } from '../types'

// Last screen of a VeggieBook: pick the cover, then save the book.
//
// The preview is the same card the home screen shows, so users see their
// book exactly as it will look: the vegetable's photo, with the chosen cover
// as the inset.
//
// Everyone who reaches this screen is a guest or an account, and both save
// to the server, so SAVE BOOK is the only way to finish. A guest's book is
// kept until they sign out, or for up to 24 hours.

type Props = {
  vegetable: Vegetable
  vegetables: Vegetable[]
  // Throws with a message for the user if the book cannot be saved.
  onSave: (cover: string) => Promise<void>
}

export function CoverChooser({ vegetable, vegetables, onSave }: Props) {
  const defaultCover = `cover/${vegetable.shortCode}.jpg`

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
        <p>Choose a cover for your {vegetable.name} VeggieBook.</p>
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

      <NavBar primaryLabel={saving ? 'SAVING...' : 'SAVE BOOK'} onPrimary={save} />
    </>
  )
}