import { useState, type ChangeEvent } from 'react'
import type { Vegetable } from '../types'
import { coverSrc } from '../utils/coverSrc'
import { resizeImage } from '../utils/resizeImage'

// The three ways to set a book's cover:
//
//   default -> the book's own vegetable cover (selected on arrival)
//   choose  -> a grid of every preset cover
//   upload  -> the user's own photo, shrunk in the browser first
//
// The original app also offered a camera option and a set of religious
// images. Neither is carried over.

// Covers offered alongside the ten vegetable covers. Must match SharedCovers
// in api/Books/BooksController.cs, which refuses any cover not on its list.
// The produce basket (cornucopia.jpg) goes in both once the owner sends it.
const SHARED_COVERS: { image: string; label: string }[] = []

type Mode = 'default' | 'choose' | 'upload'

type Props = {
  vegetable: Vegetable
  vegetables: Vegetable[]
  defaultCover: string
  selected: string
  onSelect: (image: string) => void
  onBusy: (busy: boolean) => void
}

export function CoverOptions({
  vegetable,
  vegetables,
  defaultCover,
  selected,
  onSelect,
  onBusy,
}: Props) {
  // The book's own vegetable first, then the other nine, then shared covers.
  const presets = [
    { image: defaultCover, label: `${vegetable.name} cover` },
    ...vegetables
      .filter((v) => v.code !== vegetable.code)
      .map((v) => ({ image: `cover/${v.shortCode}.jpg`, label: `${v.name} cover` })),
    ...SHARED_COVERS,
  ]

  const [mode, setMode] = useState<Mode>('default')
  const [uploaded, setUploaded] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function working(value: boolean) {
    setBusy(value)
    onBusy(value)
  }

  function pickDefault() {
    setMode('default')
    onSelect(defaultCover)
    setError(null)
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Clear the input so picking the same photo again still triggers.
    event.target.value = ''
    if (!file) return

    working(true)
    setError(null)
    try {
      const dataUrl = await resizeImage(file)
      setUploaded(dataUrl)
      onSelect(dataUrl)
      setMode('upload')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'This photo could not be used.')
    } finally {
      working(false)
    }
  }

  return (
    <>
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
          onClick={() => setMode('choose')}
        >
          Choose a cover
        </button>

        <label className={mode === 'upload' ? 'cover-mode is-active' : 'cover-mode'}>
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
                onClick={() => onSelect(preset.image)}
              >
                <img src={coverSrc(preset.image)} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {busy && <p className="message">Preparing your photo...</p>}
      {error && <p className="message">{error}</p>}
    </>
  )
}