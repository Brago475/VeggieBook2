import { useState, type ChangeEvent } from 'react'
import { useSecretCovers } from '../hooks/useSecrets'
import type { SecretCategory } from '../types'
import { coverSrc } from '../utils/coverSrc'
import { resizeImage } from '../utils/resizeImage'
import '../styles/covers.css'

// The three ways to set a Secrets Book's cover, the same three as a
// VeggieBook's (CoverOptions), with the same buttons, chips and tiles:
//
//   default -> the first kept secret's picture (selected on arrival)
//   choose  -> browse pictures one category at a time: the book's own
//              category first, then the rest in their usual order
//   upload  -> the user's own photo, shrunk in the browser first
//
// The pictures come from the API (GET /api/secret-categories/{id}/covers),
// and the API checks the cover again when the book is saved.
//
// While a category's pictures load, gray tiles the size of the real ones
// hold their place, the same way the rest of the site shows loading.

type Mode = 'default' | 'choose' | 'upload'

// Enough gray tiles to fill the first rows of the grid while it loads.
const SKELETON_TILES = 6

type Props = {
  categories: SecretCategory[]
  // The book's own category, shown first when browsing.
  categoryId: number
  defaultCover: string
  selected: string
  onSelect: (image: string) => void
  onBusy: (busy: boolean) => void
}

// "Breakfast Secrets" reads as just "Breakfast" on a chip, the way the
// VeggieBook chips name only the vegetable. Other names are left whole.
function chipName(name: string): string {
  return name.replace(/ Secrets$/, '')
}

export function SecretCoverOptions({
  categories,
  categoryId,
  defaultCover,
  selected,
  onSelect,
  onBusy,
}: Props) {
  const [mode, setMode] = useState<Mode>('default')
  const [browsing, setBrowsing] = useState(categoryId)
  const [uploaded, setUploaded] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Pictures whose file fails to load are dropped from the grid rather than
  // shown as broken tiles.
  const [broken, setBroken] = useState<Set<string>>(new Set())

  const { covers, error: coversError } = useSecretCovers(browsing)

  // The book's own category first, then the rest in their usual order.
  const own = categories.find((c) => c.id === categoryId)
  const browseOrder = own
    ? [own, ...categories.filter((c) => c.id !== categoryId)]
    : categories
  const browsingName = chipName(
    categories.find((c) => c.id === browsing)?.name ?? 'Secret',
  )

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
          <div className="cover-veg-row" role="group" aria-label="Browse covers by kind of secret">
            {browseOrder.map((c) => (
              <button
                key={c.id}
                type="button"
                className="cover-veg"
                aria-pressed={browsing === c.id}
                onClick={() => setBrowsing(c.id)}
              >
                {chipName(c.name)}
              </button>
            ))}
          </div>

          {coversError && <p className="message">{coversError}</p>}

          {!covers && !coversError && (
            <div role="status" aria-busy="true">
              <span className="visually-hidden">Loading covers...</span>
              <ul className="cover-grid" aria-hidden="true">
                {Array.from({ length: SKELETON_TILES }, (_, i) => (
                  <li key={i}>
                    <div className="skeleton secret-cover-skel" />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {covers && (
            <ul className="cover-grid">
              {covers
                .filter((image) => !broken.has(image))
                .map((image, i) => (
                  <li key={image}>
                    <button
                      type="button"
                      className="cover-tile"
                      aria-pressed={selected === image}
                      aria-label={`${browsingName} secret picture ${i + 1}`}
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