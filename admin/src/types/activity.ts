// Response shape of GET /api/admin/activity (api/Admin/AdminActivityController.cs).

export type ActivityType =
  | 'book_saved'
  | 'joined'
  | 'book_deleted'
  | 'item_removed'
  | 'book_printed'
  | 'book_downloaded'
  | 'account_deleted'
  | 'research_erased'
  | 'tracking_on'
  | 'tracking_off'
  | 'study_started'
  | 'study_ended'
  | 'study_renamed'
  | 'study_deleted'
  | 'notice_joined'
  | 'notice_declined'
  | 'notification_shown'
  | 'notification_opened'
  | 'notification_link'
  | 'notification_dismissed'
  | 'notification_created'
  | 'notification_edited'
  | 'notification_stopped'

export type ActivityEvent = {
  type: ActivityType
  researchId: string | null // null for admin actions
  title: string
  detail: string
  at: string // ISO, UTC
}

export type ActivityResponse = { events: ActivityEvent[] }