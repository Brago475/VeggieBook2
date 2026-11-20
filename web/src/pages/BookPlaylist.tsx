import { useEffect, useState } from 'react'
import { SafeImage } from '../components/common/SafeImage'
import { LeafDecor } from '../components/layout/LeafDecor'
import { PickHead } from '../components/playlists/PickHead'
import { useLang } from '../i18n/languageContext'
import { PLAYLISTS } from '../i18n/strings/playlists'
import { useStrings } from '../i18n/useStrings'
import { coverSrc } from '../utils/coverSrc'
import { fetchPlaylistLibrary, type OwnPlaylistSummary } from '../utils/playlistsApi'
import type { BookPlaylistMode } from '../utils/routes'
import { PlaylistPicker } from './PlaylistPicker'

// Making a playlist from a VeggieBook's ⋮ on home. New opens the picker
// with this book showing. Add first asks which playlist, then opens the
// picker for that playlist with this book showing; Cancel there returns to
// the list. Books are only read.

type Props = {
  bookId: string
  mode: BookPlaylistMode
  onMode: (mode: BookPlaylistMode) => void
  onSaved: (playlistId: number) => void
  onCancel: () => void
}

function Chevron() {
  return (
    <svg className="pl-entry-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BookPlaylist({ bookId, mode, onMode, onSaved, onCancel }: Props) {
  const t = useStrings(PLAYLISTS)
  const { lang } = useLang()
  const [own, setOwn] = useState<OwnPlaylistSummary[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [target, setTarget] = useState<number | null>(null)

  useEffect(() => {
    if (mode !== 'add') return
    let live = true
    fetchPlaylistLibrary(lang)
      .then((library) => {
        if (live) setOwn(library.own)
      })
      .catch(() => {
        if (live) setLoadError(true)
      })
    return () => {
      live = false
    }
  }, [mode, lang])

  if (mode === 'new') {
    return (
      <PlaylistPicker
        playlistId={null}
        startBookId={bookId}
        onSaved={onSaved}
        onCancel={onCancel}
        onMakeBook={onCancel}
      />
    )
  }

  if (target !== null) {
    return (
      <PlaylistPicker
        key={target}
        playlistId={target}
        startBookId={bookId}
        onSaved={onSaved}
        onCancel={() => setTarget(null)}
        onMakeBook={onCancel}
      />
    )
  }

  return (
    <div className="account-screen nf-screen pl-maker pk-screen">
      <LeafDecor className="account-leaf" />

      <PickHead kicker={t.kickerAdd} sub={t.chooseSub}>
        <h1 className="library-title pk-title">{t.choosePlaylist}</h1>
      </PickHead>

      {loadError && <p className="message">{t.couldNotLoad}</p>}
      {own === null && !loadError && <div className="skeleton nf-skel-detail" aria-hidden="true" />}

      {own !== null && own.length === 0 && (
        <>
          <p className="pl-empty">{t.noOwnYet}</p>
          <div className="pl-savebar">
            <button type="button" className="pl-btn" onClick={onCancel}>
              {t.cancel}
            </button>
            <button type="button" className="pl-btn is-primary" onClick={() => onMode('new')}>
              {t.newPlaylist}
            </button>
          </div>
        </>
      )}

      {own !== null && own.length > 0 && (
        <>
          <ul className="pk-list">
            {own.map((p) => {
              const photo = p.photos?.[0] ?? p.cover
              return (
                <li key={p.id}>
                  <button type="button" className="pl-pick pk-row" onClick={() => setTarget(p.id)}>
                    <SafeImage className="recipe-thumb" src={photo ? coverSrc(photo) : null} />
                    <span className="bp-row-text">
                      <span className="pl-pick-title">{p.name}</span>
                      <span className="bp-row-meta">{t.counts(0, p.recipes)}</span>
                    </span>
                    <Chevron />
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="pl-savebar">
            <button type="button" className="pl-btn" onClick={onCancel}>
              {t.cancel}
            </button>
          </div>
        </>
      )}
    </div>
  )
}