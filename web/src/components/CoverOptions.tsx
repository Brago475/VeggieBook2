import { useState, type ChangeEvent } from 'react'
import { useCovers } from '../hooks/useCovers'
import type { Vegetable } from '../types'
import { coverSrc } from '../utils/coverSrc'
import { resizeImage } from '../utils/resizeImage'
import '../styles/covers.css'

// The three ways to set a book's cover:
//
//   default -> the book's own vegetable cover (selected on arrival)
//   choose  -> browse covers one vegetable at a time: its own cover, then
//              every photo of its recipes
//   upload  -> the user's own photo, shrunk in the browser first
//
// The covers come from the API (GET /api/covers), which also checks the
// cover when the book is saved, so the two always agree. The original app's
// camera option and religious images are not carried over.

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
  const [mode, setMode] = useState<Mode>('default')
  const [browsing, setBrowsing] = useState(vegetable.code)
  const [uploaded, setUploaded] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Photos whose file fails to load are dropped from the grid rather than
  // shown as broken tiles.
  const [broken, setBroken] = useState<Set<string>>(new Set())

  const { covers, error: coversError } = useCovers(browsing)

  // The book's own vegetable first, then the rest in their usual order.
  const browseOrder = [vegetable, ...vegetables.filter((v) => v.code !== vegetable.code)]
  const browsingName = vegetables.find((v) => v.code === browsing)?.name ?? vegetable.name

  function working(value: boolean) {
    setBusy(value)
    onBusy(value)
  }

  function pickDefault() {
    setMode('default')
    onSelect(defaultCover)
    setError(null)
  }

  function hide(image: string) {
    setBroken((prev) => new Set(prev).add(image))
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
        <>
          <div className="cover-veg-row" role="group" aria-label="Browse covers by vegetable">
            {browseOrder.map((v) => (
              <button
                key={v.code}
                type="button"
                className="cover-veg"
                aria-pressed={browsing === v.code}
                onClick={() => setBrowsing(v.code)}
              >
                {v.name}
              </button>
            ))}
          </div>

          {!covers && !coversError && <p className="message">Loading covers...</p>}
          {coversError && <p className="message">{coversError}</p>}

          {covers && (
            <ul className="cover-grid">
              {covers
                .filter((image) => !broken.has(image))
                .map((image) => (
                  <li key={image}>
                    <button
                      type="button"
                      className="cover-tile"
                      aria-pressed={selected === image}
                      aria-label={
                        image.startsWith('cover/')
                          ? `${browsingName} cover`
                          : `${browsingName} recipe photo`
                      }
                      onClick={() => onSelect(image)}
                    >
                      <img
                        src={coverSrc(image)}
                        alt=""
                        loading="lazy"
                        onError={() => hide(image)}
                      />
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </>
      )}

      {busy && <p className="message">Preparing your photo...</p>}
      {error && <p className="message">{error}</p>}
    </>
  )
}