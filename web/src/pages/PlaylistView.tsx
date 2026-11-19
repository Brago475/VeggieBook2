import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { SafeImage } from '../components/common/SafeImage'
import { LeafDecor } from '../components/layout/LeafDecor'
import { NavBar } from '../components/layout/NavBar'
import { PlaylistSkeleton } from '../components/notifications/NotificationSkeletons'
import { PlaylistBar, type PlaylistBarMode } from '../components/playlists/PlaylistBar'
import { PlaylistChapter } from '../components/playlists/PlaylistChapter'
import { PlaylistHero } from '../components/playlists/PlaylistHero'
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

// One playlist. The top is styled like its card, with recipe photos that
// change every 20 seconds. Its tips and recipes are grouped by vegetable
// into chapters that fold open and closed; the first starts open. A
// recipe opens in the same view a saved book uses (RecipeSections); a tip
// opens on its own page. A bar pinned to the bottom holds the actions:
// Skip and Keep, or My playlists and Remove, for a playlist from the team;
// Edit, Add, My playlists and Delete for an own playlist. Which item is
// open is held by App, in the address. While loading, the playlist's
// outline shows.

type Props = {
  source: PlaylistSource
  playlistId: number
  open: PlaylistOpen
  // The notification this playlist was opened from, if any.
  notificationId: number | null
  onOpenItem: (open: PlaylistOpen) => void
  onEdit: () => void
  onAdd: () => void
  onDeleted: () => void
  onBack: () => void
}

type Chapter = { key: string; name: string; items: PlaylistEntry[] }

const PHOTO_LIMIT = 5

// Groups items by vegetable, in the order each vegetable first appears.
function chaptersOf(items: PlaylistEntry[]): Chapter[] {
  const byKey = new Map<string, Chapter>()
  for (const item of items) {
    const key = item.vegetable || item.vegetableName
    const chapter = byKey.get(key)
    if (chapter) chapter.items.push(item)
    else byKey.set(key, { key, name: item.vegetableName, items: [item] })
  }
  return [...byKey.values()]
}

export function PlaylistView({
  source,
  playlistId,
  open,
  notificationId,
  onOpenItem,
  onEdit,
  onAdd,
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
  // Chapters opened by the person; null until the first toggle.
  const [openChapters, setOpenChapters] = useState<Set<string> | null>(null)

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

  if (showSkeleton) return <PlaylistSkeleton label={t.loading} />

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
  const chapters = chaptersOf(data.items)
  const openSet = openChapters ?? new Set(chapters.length > 0 ? [chapters[0].key] : [])

  const photos = [
    ...new Set(
      data.items
        .map((i) => (i.kind === 'recipe' ? i.photo : null))
        .filter((p): p is string => Boolean(p)),
    ),
  ].slice(0, PHOTO_LIMIT)

  const mode: PlaylistBarMode =
    source === 'own'
      ? 'own'
      : data.choice === 'kept'
        ? 'kept'
        : data.choice === 'skipped'
          ? 'skipped'
          : 'new'

  function toggleChapter(key: string) {
    const next = new Set(openSet)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setOpenChapters(next)
  }

  return (
    <div className="account-screen nf-screen pl-screen">
      <LeafDecor className="account-leaf" />

      <PlaylistHero
        name={data.name}
        label={t.kicker}
        summary={`${t.counts(tips, recipes)}, ${t.vegetables(chapters.length)}`}
        badge={source === 'own' ? t.badgeYours : t.badgeTeam}
        source={source === 'own' ? 'own' : 'team'}
        photos={photos}
      />

      <div className="pl-chapters">
        {chapters.map((c, i) => (
          <PlaylistChapter
            key={c.key}
            kicker={t.chapter(i + 1)}
            name={c.name}
            items={c.items}
            open={openSet.has(c.key)}
            recipeLabel={t.recipe}
            tipLabel={t.tip}
            onToggle={() => toggleChapter(c.key)}
            onOpenItem={openItem}
          />
        ))}
      </div>

      {actionError && <p className="message">{actionError}</p>}

      <PlaylistBar
        mode={mode}
        busy={busy}
        onKeep={() => decide(() => keepPlaylist(playlistId, notificationId), 'kept')}
        onSkip={() => decide(() => skipPlaylist(playlistId, notificationId), 'skipped')}
        onRemove={() => decide(() => removePlaylist(playlistId), 'skipped')}
        onPlaylists={onBack}
        onEdit={onEdit}
        onAdd={onAdd}
        onDelete={() => setConfirming(true)}
      />

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