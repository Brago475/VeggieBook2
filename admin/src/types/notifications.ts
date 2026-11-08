// Shapes from api/Admin/AdminNotificationsController.cs.

export type NotificationStatus = 'scheduled' | 'live' | 'ended' | 'stopped'
export type Audience = 'all' | 'selected'

export type NotificationCounts = {
  shown: number
  opened: number
  link: number
  dismissed: number
}

export type AdminNotification = {
  id: number
  // Admin-only label; the app never shows it.
  title: string | null
  bodyEn: string
  hasSpanish: boolean
  templateKey: string | null
  vegetable: string | null
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
  updatedAt: string | null
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
// sets the start to the moment it saves, and startsAt is null.
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
}