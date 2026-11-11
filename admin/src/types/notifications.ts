import type { MealKey } from './playlists'

// Shapes from api/Admin/AdminNotificationsController.cs.

export type NotificationStatus = 'scheduled' | 'live' | 'ended' | 'stopped'
export type Audience = 'all' | 'selected'
export type PlaylistMode = 'none' | 'auto' | 'made'

export type NotificationCounts = {
  shown: number
  opened: number
  link: number
  dismissed: number
}

// The playlist a notification opens.
export type NotificationPlaylist = {
  id: number
  name: string
  auto: boolean
  vegetable: string | null
  meal: MealKey | null
  archived: boolean
  tips: number
  recipes: number
}

export type AdminNotification = {
  id: number
  // Row version; sent back on edit so a stale copy is refused.
  version: number
  // Admin-only label; the app never shows it.
  title: string | null
  bodyEn: string
  hasSpanish: boolean
  templateKey: string | null
  vegetable: string | null
  playlist: NotificationPlaylist | null
  audience: Audience
  includeGuests: boolean
  includeIds: string[]
  excludeIds: string[]
  startsAt: string
  expiresAt: string
  repeatDays: number | null
  status: NotificationStatus
  round: number
  createdAt: string
  // Admin usernames; null on older messages.
  createdBy: string | null
  updatedAt: string | null
  updatedBy: string | null
  stoppedAt: string | null
  counts: NotificationCounts
}

export type NotificationTemplate = {
  key: string
  en: string
  es: string
  needsVegetable: boolean
}

export type NotificationVegetable = {
  key: string
  en: string
}

export type TemplatesResponse = {
  templates: NotificationTemplate[]
  vegetables: NotificationVegetable[]
  slot: string
}

export type PickPerson = {
  researchId: string
  ageRange: string | null
  joinedAt: string
}

// What the editor sends. Dates are ISO strings. With startNow the server
// sets the start to the moment it saves, and startsAt is null. version is
// the one the editor opened with; null when creating.
export type NotificationDraft = {
  title: string | null
  bodyEn: string
  templateKey: string | null
  vegetable: string | null
  startNow: boolean
  startsAt: string | null
  expiresAt: string
  repeatDays: number | null
  audience: Audience
  includeGuests: boolean
  includeIds: string[]
  excludeIds: string[]
  playlistMode: PlaylistMode
  playlistId: number | null
  playlistVegetable: string | null
  playlistMeal: MealKey | null
  version: number | null
}