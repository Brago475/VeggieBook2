import type { Schedule } from '../components/notifications/schedule'
import type { PlaylistChoice } from '../components/notifications/playlistChoice'
import type { Audience } from './notifications'
import type { PickedItem } from './playlists'

// Shapes of /api/admin/drafts (api/Admin/AdminDraftsController.cs). The
// payload is the editor's state; the server stores it as given.

export type DraftKind = 'playlist' | 'notification'

export type SavedDraft<T> = {
  id: number
  kind: DraftKind
  title: string | null
  payload: T
  createdAt: string
  // Admin usernames.
  createdBy: string | null
  updatedAt: string | null
  updatedBy: string | null
}

export type PlaylistDraftData = {
  nameEn: string
  nameEs: string
  items: PickedItem[]
}

// Dates travel as ISO strings and become Dates again when a draft opens.
export type StoredSchedule = Omit<Schedule, 'startDay' | 'endDay'> & {
  startDay: string | null
  endDay: string | null
}

export type NotificationDraftData = {
  title: string
  templateKey: string
  vegetable: string
  body: string
  playlist: PlaylistChoice
  schedule: StoredSchedule
  audience: Audience
  includeGuests: boolean
  includeIds: string[]
  excludeIds: string[]
}