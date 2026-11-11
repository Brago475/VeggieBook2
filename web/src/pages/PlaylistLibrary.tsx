import { LeafDecor } from '../components/layout/LeafDecor'
import { CardListSkeleton } from '../components/notifications/NotificationSkeletons'
import { SectionSwitch } from '../components/notifications/SectionSwitch'
import { PlaylistRow } from '../components/playlists/PlaylistRow'
import { useHeld } from '../hooks/useHeld'
import { usePlaylistLibrary } from '../hooks/usePlaylists'
import { NOTIFICATIONS } from '../i18n/strings/notifications'
import { PLAYLISTS } from '../i18n/strings/playlists'
import { useStrings } from '../i18n/useStrings'
import type { PlaylistSource } from '../utils/routes'

// The Playlists tab of Notifications: playlists kept from notifications,
// then the account's own playlists. Own playlists are made from a book's ⋮.
// While loading, playlist card outlines show.

type Props = {
  onMessages: () => void
  onOpen: (source: PlaylistSource, id: number) => void
}

const SKELETON_CARDS = 2

export function PlaylistLibrary({ onMessages, onOpen }: Props) {
  const t = useStrings(PLAYLISTS)
  const nt = useStrings(NOTIFICATIONS)
  const { data, error, loading } = usePlaylistLibrary()
  const showSkeleton = useHeld(loading)

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

      {!showSkeleton && data && (
        <>
          <section className="nf-section">
            <h2 className="nf-group-label">{t.keptTitle}</h2>
            {data.kept.length === 0 ? (
              <p className="pl-empty">{t.keptEmpty}</p>
            ) : (
              <ul className="nf-list">
                {data.kept.map((p) => (
                  <li key={p.id}>
                    <PlaylistRow
                      name={p.name}
                      detail={t.counts(p.tips, p.recipes)}
                      cover={p.cover}
                      onOpen={() => onOpen('admin', p.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="nf-section">
            <h2 className="nf-group-label">{t.mineTitle}</h2>
            {data.own.length === 0 ? (
              <p className="pl-empty">{t.mineEmpty}</p>
            ) : (
              <ul className="nf-list">
                {data.own.map((p) => (
                  <li key={p.id}>
                    <PlaylistRow
                      name={p.name}
                      detail={t.counts(0, p.recipes)}
                      cover={p.cover}
                      onOpen={() => onOpen('own', p.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}