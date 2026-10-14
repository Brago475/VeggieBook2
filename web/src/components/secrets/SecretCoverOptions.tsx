import { useState, type ChangeEvent } from 'react'
import { useSecretCovers } from '../../hooks/useSecrets'
import { COVERS } from '../../i18n/strings/covers'
import { SECRETS } from '../../i18n/strings/secrets'
import { useStrings } from '../../i18n/useStrings'
import type { SecretCategory } from '../../types'
import { coverSrc } from '../../utils/coverSrc'
import { resizeImage } from '../../utils/resizeImage'
import '../../styles/covers.css'

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
// VeggieBook chips name only the vegetable. Spanish names drop a leading
// "Secretos para el" or similar the same way. Other names are left whole.
function chipName(name: string): string {
  const short = name
    .replace(/ Secrets$/, '')
    .replace(/^Secretos (para |de |del )?(el |la |los |las )?/i, '')
  return short.charAt(0).toUpperCase() + short.slice(1)
}

export function SecretCoverOptions({
  categories,
  categoryId,
  defaultCover,
  selected,
  onSelect,
  onBusy,
}: Props) {
  const c = useStrings(COVERS)
  const t = useStrings(SECRETS)

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
  const own = categories.find((cat) => cat.id === categoryId)
  const browseOrder = own
    ? [own, ...categories.filter((cat) => cat.id !== categoryId)]
    : categories
  const browsingName = chipName(
    categories.find((cat) => cat.id === browsing)?.name ?? t.secretFallback,
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
      setError(err instanceof Error ? err.message : c.photoUnusable)
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
          {c.useDefault}
        </button>

        <button
          type="button"
          className="cover-mode"
          aria-pressed={mode === 'choose'}
          onClick={() => setMode('choose')}
        >
          {c.choose}
        </button>

        <label className={mode === 'upload' ? 'cover-mode is-active' : 'cover-mode'}>
          <input
            className="cover-upload-input"
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={busy}
          />
          {uploaded ? c.uploadDifferent : c.uploadOwn}
        </label>
      </div>

      {mode === 'choose' && (
        <>
          <div className="cover-veg-row" role="group" aria-label={t.browseBy}>
            {browseOrder.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className="cover-veg"
                aria-pressed={browsing === cat.id}
                onClick={() => setBrowsing(cat.id)}
              >
                {chipName(cat.name)}
              </button>
            ))}
          </div>

          {coversError && <p className="message">{coversError}</p>}

          {!covers && !coversError && (
            <div role="status" aria-busy="true">
              <span className="visually-hidden">{c.loadingCovers}</span>
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
                      aria-label={t.pictureLabel(browsingName, i + 1)}
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

      {busy && <p className="message">{c.preparing}</p>}
      {error && <p className="message">{error}</p>}
    </>
  )
}