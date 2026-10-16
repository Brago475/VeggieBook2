// Response shape of GET /api/admin/activity (api/Admin/AdminActivityController.cs).

export type ActivityType =
  | 'book_saved'
  | 'joined'
  | 'book_deleted'
  | 'item_removed'
  | 'account_deleted'
  | 'tracking_on'
  | 'tracking_off'
  | 'study_started'
  | 'study_ended'
  | 'study_renamed'
  | 'study_deleted'
  | 'notice_joined'
  | 'notice_declined'

export type ActivityEvent = {
  type: ActivityType
  researchId: string | null // null for admin actions
  title: string
  detail: string
  at: string // ISO, UTC
}

export type ActivityResponse = { events: ActivityEvent[] }