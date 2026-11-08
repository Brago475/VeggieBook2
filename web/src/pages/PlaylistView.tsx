import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { SafeImage } from '../components/common/SafeImage'
import { LeafIcon } from '../components/icons/LibraryIcons'
import { LeafDecor } from '../components/layout/LeafDecor'
import { NavBar } from '../components/layout/NavBar'
import { TipView } from '../components/playlists/TipView'
import { RecipeSections } from '../components/veggie/RecipeSections'
import { RecipeSkeleton } from '../components/veggie/RecipeSkeleton'
import { useHeld } from '../hooks/useHeld'
import { usePlaylistDetail } from '../hooks/usePlaylists'
import { useRecipeDetail } from '../hooks/useRecipeDetail'
import { PLAYLISTS } from '../i18n/strings/playlists'
import { useStrings } from '../i18n/useStrings'
import { coverSrc } from '../utils/coverSrc'
import {
  deleteOwnPlaylist,
  keepPlaylist,
  ownRecipeOpened,
  playlistItemOpened,
  removePlaylist,
  skipPlaylist,
  type PlaylistChoice,
  type PlaylistEntry,
} from '../utils/playlistsApi'
import type { PlaylistOpen, PlaylistSource } from '../utils/routes'

// One playlist: its tips and recipes as rows. A recipe opens in the same
// view a saved book uses (RecipeSections); a tip opens on its own page.
// A playlist from the team ends with Skip and Keep; an own playlist has Edit
// and Delete. Which item is open is held by App, in the address.

type Props = {
  source: PlaylistSource
  playlistId: number
  open: PlaylistOpen
  // The notification this playlist was opened from, if any.
  notificationId: number | null
  onOpenItem: (open: PlaylistOpen) => void
  onEdit: () => void
  onDeleted: () => void
  onBack: () => void
}

export function PlaylistView({
  source,
  playlistId,
  open,
  notificationId,
  onOpenItem,
  onEdit,
  onDeleted,
  onBack,
}: Props) {
  const t = useStrings(PLAYLISTS)
  const { data, error, loading, setChoice } = usePlaylistDetail(source, playlistId)
  const showSkeleton = useHeld(loading)

  const openRecipeId = open?.kind === 'recipe' ? open.id : null
  const { detail, error: recipeError } = useRecipeDetail(openRecipeId)
  const recipeLoading = useHeld(openRecipeId !== null && !detail && !recipeError)

  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  // Records each item opened, once per opening.
  const sentFor = useRef<string | null>(null)
  const openKind = open?.kind ?? null
  const openId = open?.id ?? null
  useEffect(() => {
    if (openKind === null || openId === null) {
      sentFor.current = null
      return
    }
    if (!data) return
    const key = `${openKind}:${openId}`
    if (sentFor.current === key) return
    sentFor.current = key
    const call =
      source === 'admin'
        ? playlistItemOpened(playlistId, openKind, openId)
        : ownRecipeOpened(playlistId, openId)
    call.catch(() => {})
  }, [openKind, openId, data, source, playlistId])

  function openItem(item: PlaylistEntry) {
    onOpenItem({ kind: item.kind, id: item.id })
    window.scrollTo(0, 0)
  }

  async function decide(run: () => Promise<void>, next: PlaylistChoice) {
    if (busy) return
    setBusy(true)
    setActionError(null)
    try {
      await run()
      setChoice(next)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.somethingWrong)
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (busy) return
    setBusy(true)
    setActionError(null)
    try {
      await deleteOwnPlaylist(playlistId)
      onDeleted()
      return
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.somethingWrong)
    }
    setBusy(false)
    setConfirming(false)
  }

  if (showSkeleton) {
    return (
      <div className="account-screen nf-screen" role="status" aria-busy="true">
        <span className="visually-hidden">{t.loading}</span>
        <div className="skeleton nf-skel-detail" aria-hidden="true" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="account-screen nf-screen">
        <p className="message">{t.notFound}</p>
        <button type="button" className="account-btn nf-back" onClick={onBack}>
          {t.backToPlaylists}
        </button>
      </div>
    )
  }

  // One recipe, opened from the list.
  if (open?.kind === 'recipe') {
    const topPhoto = detail?.photos[0] ?? null
    return (
      <>
        {recipeLoading && <RecipeSkeleton />}
        {!recipeLoading && recipeError && <p className="message">{t.somethingWrong}</p>}
        {!recipeLoading && detail && (
          <article className="recipe-detail">
            <h2>{detail.title}</h2>
            {topPhoto && <SafeImage className="recipe-photo" src={coverSrc(topPhoto)} />}
            <RecipeSections detail={detail} topPhoto={topPhoto} />
          </article>
        )}
        <NavBar primaryLabel={t.backToPlaylist} onPrimary={() => onOpenItem(null)} />
      </>
    )
  }

  // One tip, opened from the list.
  if (open?.kind === 'tip') {
    const tip = data.items.find((i) => i.kind === 'tip' && i.id === open.id)
    return (
      <>
        {tip && tip.kind === 'tip' ? <TipView tip={tip} /> : <p className="message">{t.notFound}</p>}
        <NavBar primaryLabel={t.backToPlaylist} onPrimary={() => onOpenItem(null)} />
      </>
    )
  }

  const tips = data.items.filter((i) => i.kind === 'tip').length
  const recipes = data.items.length - tips

  return (
    <div className="account-screen nf-screen pl-screen">
      <LeafDecor className="account-leaf" />

      <header className="pl-head">
        <span className="pl-kicker">{t.kicker}</span>
        <h1 className="library-title">{data.name}</h1>
        <p className="library-sub">{t.counts(tips, recipes)}</p>
      </header>

      {source === 'own' && (
        <div className="pl-actions">
          <button type="button" className="pl-btn" onClick={onEdit}>
            {t.edit}
          </button>
          <button type="button" className="pl-btn is-danger" onClick={() => setConfirming(true)}>
            {t.delete}
          </button>
        </div>
      )}

      {actionError && <p className="message">{actionError}</p>}

      <ul className="book-recipes pl-items">
        {data.items.map((item) => (
          <li key={`${item.kind}:${item.id}`}>
            <button type="button" className="recipe-row" onClick={() => openItem(item)}>
              {item.kind === 'recipe' ? (
                <SafeImage className="recipe-thumb" src={item.photo ? coverSrc(item.photo) : null} />
              ) : (
                <span className="recipe-thumb pl-tip-thumb" aria-hidden="true">
                  <LeafIcon />
                </span>
              )}
              <span className="pl-item-text">
                <span className="recipe-row-title">{item.title}</span>
                <span className="pl-item-meta">
                  {item.kind === 'tip' ? t.tip : t.recipe}, {item.vegetableName}
                </span>
              </span>
              <svg className="recipe-row-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M9 5l7 7-7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {source === 'admin' && (
        <div className="pl-decide">
          {data.choice === 'kept' ? (
            <>
              <p className="pl-decide-note">{t.keptNote}</p>
              <button
                type="button"
                className="pl-btn"
                disabled={busy}
                onClick={() => decide(() => removePlaylist(playlistId), 'skipped')}
              >
                {t.remove}
              </button>
            </>
          ) : (
            <>
              {data.choice === 'skipped' && <p className="pl-decide-note">{t.skippedNote}</p>}
              <div className="pl-decide-row">
                <button
                  type="button"
                  className="pl-btn"
                  disabled={busy || data.choice === 'skipped'}
                  onClick={() => decide(() => skipPlaylist(playlistId, notificationId), 'skipped')}
                >
                  {t.skip}
                </button>
                <button
                  type="button"
                  className="pl-btn is-primary"
                  disabled={busy}
                  onClick={() => decide(() => keepPlaylist(playlistId, notificationId), 'kept')}
                >
                  {t.keep}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {source === 'own' && (
        <ConfirmDialog
          open={confirming}
          title={t.deleteTitle(data.name)}
          body={t.deleteBody}
          confirmLabel={t.delete}
          cancelLabel={t.cancel}
          danger
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => {
            if (!busy) setConfirming(false)
          }}
        />
      )}
    </div>
  )
}