import { useState } from 'react'
import { BookCard } from '../components/BookCard'
import { CoverOptions } from '../components/CoverOptions'
import { NavBar } from '../components/NavBar'
import type { Vegetable } from '../types'

// Last screen of a VeggieBook: pick the cover, then finish the book.
//
// The preview is the same card the home screen shows, so users see their
// book exactly as it will look: the vegetable's photo, with the chosen cover
// as the inset.
//
// Signed in, SAVE BOOK saves to the account. A guest gets two choices:
// create an account and save the book into it, or finish without saving and
// keep the book on this page until it closes.

type Props = {
  vegetable: Vegetable
  vegetables: Vegetable[]
  signedIn: boolean
  // Throws with a message for the user if the book cannot be saved.
  onSave: (cover: string) => Promise<void>
  onCreateAccount: (cover: string) => void
  onFinishWithoutSaving: (cover: string) => void
}

export function CoverChooser({
  vegetable,
  vegetables,
  signedIn,
  onSave,
  onCreateAccount,
  onFinishWithoutSaving,
}: Props) {
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

      {signedIn ? (
        <NavBar primaryLabel={saving ? 'SAVING...' : 'SAVE BOOK'} onPrimary={save} />
      ) : (
        <>
          <NavBar
            primaryLabel="CREATE ACCOUNT AND SAVE"
            onPrimary={() => {
              if (!uploading) onCreateAccount(selected)
            }}
          />
          <div className="account-page">
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                if (!uploading) onFinishWithoutSaving(selected)
              }}
            >
              Finish without saving
            </button>
            <p className="field-hint account-center">
              Without an account, your book stays on this page until you close it.
            </p>
          </div>
        </>
      )}
    </>
  )
}