import { useCallback, useState } from 'react'
import { MessagesSection } from '../components/notifications/MessagesSection'
import { PlaylistsSection } from '../components/playlists/PlaylistsSection'
import type { PlaylistSummary } from '../types/playlists'
import '../styles/studies.css'
import '../styles/studies-edit.css'
import '../styles/notifications.css'
import '../styles/notification-sections.css'
import '../styles/playlists.css'
import '../styles/playlist-cards.css'
import '../styles/meal-labels.css'

// Notifications page, in two sections: Messages (shown in the main site as a
// pop-up and in its Notifications section, and able to open a playlist) and
// Playlists (hand-made and automatic playlists, and their meal labels). Each
// section has its own top bar button. Send on a playlist card switches to
// Messages and opens a new notification with that playlist chosen.
// APIs: api/Admin/AdminNotificationsController.cs, AdminPlaylistsController.cs
// and AdminMealLabelsController.cs.

type Section = 'messages' | 'playlists'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'messages', label: 'Messages' },
  { id: 'playlists', label: 'Playlists' },
]

export function Notifications() {
  const [section, setSection] = useState<Section>('messages')
  const [sendPlaylistId, setSendPlaylistId] = useState<number | null>(null)
  const clearSend = useCallback(() => setSendPlaylistId(null), [])

  function send(p: PlaylistSummary) {
    setSendPlaylistId(p.id)
    setSection('messages')
  }

  return (
    <div className="nt-page">
      <div className="nt-sections" role="tablist" aria-label="Notifications sections">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={section === s.id}
            className={section === s.id ? 'nt-section-tab is-active' : 'nt-section-tab'}
            onClick={() => setSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'messages' ? (
        <MessagesSection sendPlaylistId={sendPlaylistId} onSendOpened={clearSend} />
      ) : (
        <PlaylistsSection onSend={send} />
      )}
    </div>
  )
}