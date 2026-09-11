import { useState, type ChangeEvent } from 'react'
import { NavBar } from '../components/NavBar'
import type { Vegetable } from '../types'
import { coverSrc } from '../utils/coverSrc'
import { resizeImage } from '../utils/resizeImage'

// Last screen of a VeggieBook. Three ways to set the cover:
//
//   default -> the book's own vegetable cover (selected on arrival)
//   choose  -> a grid of every preset cover
//   upload  -> the user's own photo, shrunk in the browser
//
// The preview reuses the home screen's book card, so users see their book
// exactly as it will appear in their library. SAVE BOOK hands the chosen
// image to App, which builds and stores the book.
//
// The original also offered a camera option and a set of religious images.
// Neither is carried over: this is a web app, and the images were a
// content decision.

// Covers offered alongside the ten vegetable covers. The original's produce
// basket (cornucopia.jpg) goes here once the owner provides the file.
const SHARED_COVERS: { image: string; label: string }[] = []

type Mode = 'default' | 'choose' | 'upload'

type Props = {
  vegetable: Vegetable
  vegetables: Vegetable[]
  // Returns false if the book could not be saved.
  onSave: (image: string) => boolean
}

export function CoverChooser({ vegetable, vegetables, onSave }: Props) {
  const defaultCover = `cover/${vegetable.shortCode}.jpg`

  // The book's own vegetable first, then the other nine, then any shared
  // presets.
  const presets = [
    { image: defaultCover, label: `${vegetable.name} cover` },
    ...vegetables
      .filter((v) => v.code !== vegetable.code)
      .map((v) => ({
        image: `cover/${v.shortCode}.jpg`,
        label: `${v.name} cover`,
      })),
    ...SHARED_COVERS,
  ]

  const [mode, setMode] = useState<Mode>('default')
  const [selected, setSelected] = useState(defaultCover)
  const [uploaded, setUploaded] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function pickDefault() {
    setMode('default')
    setSelected(defaultCover)
    setError(null)
  }

  function openGrid() {
    setMode('choose')
    setError(null)
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Clear the input so picking the same photo again still triggers.
    event.target.value = ''
    if (!file) return

    setBusy(true)
    setError(null)
    try {
      const dataUrl = await resizeImage(file)
      setUploaded(dataUrl)
      setSelected(dataUrl)
      setMode('upload')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'This photo could not be used.',
      )
    } finally {
      setBusy(false)
    }
  }

  function save() {
    if (busy) return
    if (!onSave(selected)) {
      setError(
        'Your book could not be saved because this browser is out of ' +
          'storage space. Try the default cover or choose one instead of ' +
          'your own photo.',
      )
    }
  }

  return (
    <>
      <div className="intro-text">
        <p>Choose a cover for your {vegetable.name} VeggieBook.</p>
      </div>

      <div className="cover-preview">
        <div className="book-card">
          <img className="book-card-img" src={coverSrc(selected)} alt="" />
          <span className="book-card-name">{vegetable.name}</span>
        </div>
      </div>

      <div className="cover-modes">
        <button
          type="button"
          className="cover-mode"
          aria-pressed={mode === 'default'}
          onClick={pickDefault}
        >
          Use default cover
        </button>

        <button
          type="button"
          className="cover-mode"
          aria-pressed={mode === 'choose'}
          onClick={openGrid}
        >
          Choose a cover
        </button>

        <label
          className={mode === 'upload' ? 'cover-mode is-active' : 'cover-mode'}
        >
          <input
            className="cover-upload-input"
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={busy}
          />
          {uploaded ? 'Upload a different cover' : 'Upload your own cover'}
        </label>
      </div>

      {mode === 'choose' && (
        <ul className="cover-grid">
          {presets.map((preset) => (
            <li key={preset.image}>
              <button
                type="button"
                className="cover-tile"
                aria-pressed={selected === preset.image}
                aria-label={preset.label}
                onClick={() => setSelected(preset.image)}
              >
                <img src={coverSrc(preset.image)} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {busy && <p className="message">Preparing your photo...</p>}
      {error && <p className="message">{error}</p>}

      <NavBar primaryLabel="SAVE BOOK" onPrimary={save} />
    </>
  )
}