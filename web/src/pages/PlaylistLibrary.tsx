import { LeafDecor } from '../components/layout/LeafDecor'
import { GhostEmpty } from '../components/notifications/GhostEmpty'
import { CardListSkeleton } from '../components/notifications/NotificationSkeletons'
import { SectionSwitch } from '../components/notifications/SectionSwitch'
import { NewPlaylistCard } from '../components/playlists/NewPlaylistCard'
import { PlaylistCard } from '../components/playlists/PlaylistCard'
import { useHeld } from '../hooks/useHeld'
import { usePlaylistLibrary } from '../hooks/usePlaylists'
import { NOTIFICATIONS } from '../i18n/strings/notifications'
import { PLAYLISTS } from '../i18n/strings/playlists'
import { useStrings } from '../i18n/useStrings'
import type { PlaylistSource } from '../utils/routes'

// The Playlists tab of Notifications: a New playlist card, then the
// account's own playlists and those kept from notifications, each group
// newest first. While loading, playlist card outlines show. With no
// playlists at all, faded rows show with a button to make one.

type Props = {
  onMessages: () => void
  onOpen: (source: PlaylistSource, id: number) => void
  onNew: () => void
}

type Card = {
  key: string
  source: PlaylistSource
  id: number
  name: string
  count: string
  photos: string[]
  at: number
}

const SKELETON_CARDS = 2
// Cards start their slideshows this far apart.
const STAGGER_MS = 5000

function newestFirst(a: Card, b: Card) {
  return b.at - a.at
}

export function PlaylistLibrary({ onMessages, onOpen, onNew }: Props) {
  const t = useStrings(PLAYLISTS)
  const nt = useStrings(NOTIFICATIONS)
  const { data, error, loading } = usePlaylistLibrary()
  const showSkeleton = useHeld(loading)

  const own: Card[] = data
    ? data.own
        .map((p) => ({
          key: `own-${p.id}`,
          source: 'own' as const,
          id: p.id,
          name: p.name,
          count: t.counts(0, p.recipes),
          photos: p.photos ?? (p.cover ? [p.cover] : []),
          at: Date.parse(p.updatedAt) || 0,
        }))
        .sort(newestFirst)
    : []

  const kept: Card[] = data
    ? data.kept
        .map((p) => ({
          key: `admin-${p.id}`,
          source: 'admin' as const,
          id: p.id,
          name: p.name,
          count: t.counts(p.tips, p.recipes),
          photos: p.photos ?? (p.cover ? [p.cover] : []),
          at: Date.parse(p.keptAt) || 0,
        }))
        .sort(newestFirst)
    : []

  const isEmpty = data !== null && own.length === 0 && kept.length === 0
  const ready = !showSkeleton && !error && data !== null

  function renderGroup(label: string, cards: Card[], offset: number) {
    if (cards.length === 0) return null
    return (
      <section>
        <p className="nf-group-label">{label}</p>
        <ul className="pl-cards">
          {cards.map((c, i) => (
            <li key={c.key}>
              <PlaylistCard
                name={c.name}
                label={t.kicker}
                count={c.count}
                badge={c.source === 'own' ? t.badgeYours : t.badgeTeam}
                source={c.source === 'own' ? 'own' : 'team'}
                openLabel={t.open}
                photos={c.photos}
                delay={(offset + i) * STAGGER_MS}
                onOpen={() => onOpen(c.source, c.id)}
              />
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <div className="account-screen nf-screen">
      <LeafDecor className="account-leaf" />

      <div className="library-head">
        <div className="library-head-text">
          <h1 className="library-title">{nt.title}</h1>
          <p className="library-sub">{nt.sub}</p>
        </div>
      </div>

      <SectionSwitch active="playlists" onMessages={onMessages} onPlaylists={() => {}} />

      {showSkeleton && <CardListSkeleton label={t.loading} kind="playlist" count={SKELETON_CARDS} />}

      {!showSkeleton && error && <p className="message">{t.couldNotLoad}</p>}

      {ready && isEmpty && (
        <GhostEmpty
          kind="playlist"
          label={t.kicker}
          title={t.emptyTitle}
          body={t.emptyBody}
          action={{ label: t.newPlaylist, onClick: onNew }}
        />
      )}

      {ready && !isEmpty && (
        <>
          <NewPlaylistCard title={t.newPlaylist} sub={t.newCardSub} onClick={onNew} />
          {renderGroup(t.mineTitle, own, 0)}
          {renderGroup(t.keptTitle, kept, own.length)}
        </>
      )}
    </div>
  )
}