import { useState, type ChangeEvent } from 'react'
import { useCovers } from '../../hooks/useCovers'
import { COVERS } from '../../i18n/strings/covers'
import { useStrings } from '../../i18n/useStrings'
import type { Vegetable } from '../../types'
import { coverSrc } from '../../utils/coverSrc'
import { resizeImage } from '../../utils/resizeImage'
import '../../styles/covers.css'

// The three ways to set a book's cover:
//
//   default -> the book's own vegetable cover (selected on arrival)
//   choose  -> browse covers one vegetable at a time: its own cover, any
//              extra photos of it, then every photo of its recipes
//   upload  -> the user's own photo, shrunk in the browser first
//
// The covers come from the API (GET /api/covers), which also checks the
// cover when the book is saved, so the two always agree. The original app's
// camera option and religious images are not carried over.
//
// The API also returns a "more" list of the app's own artwork. It is not
// shown yet: the graphics carry baked-in text and crop badly as covers.
// The endpoint keeps returning it, so bringing the section back is a
// change here only.

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
  const t = useStrings(COVERS)

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

  function label(image: string): string {
    if (image.startsWith('cover/')) return t.coverLabel(browsingName)
    if (image.startsWith('stock/')) return t.photoLabel(browsingName)
    return t.recipePhotoLabel(browsingName)
  }

  function tiles(images: string[]) {
    return images
      .filter((image) => !broken.has(image))
      .map((image) => (
        <li key={image}>
          <button
            type="button"
            className="cover-tile"
            aria-pressed={selected === image}
            aria-label={label(image)}
            onClick={() => onSelect(image)}
          >
            <img src={coverSrc(image)} alt="" loading="lazy" onError={() => hide(image)} />
          </button>
        </li>
      ))
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
      setError(err instanceof Error ? err.message : t.photoUnusable)
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
          {t.useDefault}
        </button>

        <button
          type="button"
          className="cover-mode"
          aria-pressed={mode === 'choose'}
          onClick={() => setMode('choose')}
        >
          {t.choose}
        </button>

        <label className={mode === 'upload' ? 'cover-mode is-active' : 'cover-mode'}>
          <input
            className="cover-upload-input"
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={busy}
          />
          {uploaded ? t.uploadDifferent : t.uploadOwn}
        </label>
      </div>

      {mode === 'choose' && (
        <>
          <div className="cover-veg-row" role="group" aria-label={t.browseBy}>
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

          {!covers && !coversError && <p className="message">{t.loadingCovers}</p>}
          {coversError && <p className="message">{coversError}</p>}

          {covers && <ul className="cover-grid">{tiles(covers)}</ul>}
        </>
      )}

      {busy && <p className="message">{t.preparing}</p>}
      {error && <p className="message">{error}</p>}
    </>
  )
}