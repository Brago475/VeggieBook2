import { useEffect, useState } from 'react'
import type { PickedItem, PlaylistEntry, PlaylistKind } from '../../types/playlists'
import { previewItems } from '../../utils/playlistsApi'
import { NavIcon } from '../icons/NavIcons'
import { itemKey } from './playlistFormat'
import { ZoomImage } from './ZoomImage'

// The playlist as the app shows it, in English or Spanish, with the text
// from the server.

type Lang = 'en' | 'es'

type Props = {
  nameEn: string
  nameEs: string
  items: PickedItem[]
}

const WORDS = {
  en: { kicker: 'Playlist', tip: 'tip', tips: 'tips', recipe: 'recipe', recipes: 'recipes', skip: 'Skip', keep: 'Keep' },
  es: { kicker: 'Lista', tip: 'consejo', tips: 'consejos', recipe: 'receta', recipes: 'recetas', skip: 'Omitir', keep: 'Guardar' },
}

// "10 recipes, 2 tips", leaving out a kind with none.
function countLine(lang: Lang, tips: number, recipes: number): string {
  const w = WORDS[lang]
  const parts: string[] = []
  if (recipes > 0) parts.push(`${recipes} ${recipes === 1 ? w.recipe : w.recipes}`)
  if (tips > 0) parts.push(`${tips} ${tips === 1 ? w.tip : w.tips}`)
  return parts.join(', ')
}

function Photo({ photo }: { photo: string | null | undefined }) {
  if (photo) return <ZoomImage photo={photo} />
  return (
    <span className="pl-phone-leaf">
      <NavIcon name="leaf" size={20} />
    </span>
  )
}

export function PlaylistPreview({ nameEn, nameEs, items }: Props) {
  const [lang, setLang] = useState<Lang>('en')
  const [entries, setEntries] = useState<PlaylistEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  const key = items.map((i) => itemKey(i.kind, i.id)).join(',')

  useEffect(() => {
    const refs = key
      ? key.split(',').map((k) => {
          const [kind, id] = k.split(':')
          return { kind: kind as PlaylistKind, id: Number(id) }
        })
      : []
    if (refs.length === 0) {
      setEntries([])
      setError(null)
      return
    }

    let live = true
    const timer = window.setTimeout(async () => {
      try {
        const result = await previewItems(refs, lang)
        if (live) {
          setEntries(result.items)
          setError(null)
        }
      } catch (err) {
        if (live) setError((err as Error).message)
      }
    }, 300)

    return () => {
      live = false
      window.clearTimeout(timer)
    }
  }, [key, lang])

  const w = WORDS[lang]
  const name = (lang === 'es' && nameEs.trim()) || nameEn.trim() || 'Untitled playlist'
  const tips = entries.filter((e) => e.kind === 'tip').length

  return (
    <div className="pl-preview">
      <div className="pl-preview-head">
        <span className="nt-label">Preview</span>
        <div className="pl-lang" role="tablist" aria-label="Preview language">
          {(['en', 'es'] as const).map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={lang === l}
              className={lang === l ? 'is-active' : undefined}
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="pl-phone">
        <div className="pl-phone-screen">
          <span className="pl-phone-kicker">{w.kicker}</span>
          <strong className="pl-phone-title">{name}</strong>
          <span className="pl-phone-count">{countLine(lang, tips, entries.length - tips)}</span>

          {entries.length === 0 ? (
            <p className="pl-phone-empty">Items you add show here.</p>
          ) : (
            <ul className="pl-phone-list">
              {entries.map((e) =>
                e.kind === 'recipe' ? (
                  <li key={itemKey(e.kind, e.id)} className="pl-phone-card">
                    <Photo photo={e.photo} />
                    <div>
                      <span className="pl-phone-meta">{e.vegetableName}</span>
                      <strong>{e.title}</strong>
                      <span className="pl-phone-meta">{e.timeToPrepare}</span>
                    </div>
                  </li>
                ) : (
                  <li key={itemKey(e.kind, e.id)} className="pl-phone-card">
                    <Photo photo={e.blocks.find((b) => b.image)?.image} />
                    <div>
                      <span className="pl-phone-meta">{e.vegetableName}</span>
                      <strong>{e.title}</strong>
                      {e.blocks[0] && <span className="pl-phone-snippet">{e.blocks[0].text}</span>}
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}

          <div className="pl-phone-actions" aria-hidden="true">
            <span className="pl-phone-skip">{w.skip}</span>
            <span className="pl-phone-keep">{w.keep}</span>
          </div>
        </div>
      </div>

      {lang === 'es' && !nameEs.trim() && nameEn.trim() && (
        <span className="nt-hint">No Spanish name, so Spanish readers see the English name.</span>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}