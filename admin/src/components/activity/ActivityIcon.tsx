import type { ActivityType } from '../../types/activity'

// Colored icon tile for each activity type.

const tone: Record<ActivityType, string> = {
  book_saved: 'is-saved',
  joined: 'is-joined',
  book_deleted: 'is-deleted',
  item_removed: 'is-deleted',
  book_printed: 'is-saved',
  book_downloaded: 'is-saved',
  account_deleted: 'is-account',
  research_erased: 'is-deleted',
  tracking_on: 'is-tracking',
  tracking_off: 'is-tracking',
  study_started: 'is-study',
  study_ended: 'is-study',
  study_renamed: 'is-study',
  study_deleted: 'is-deleted',
  notice_joined: 'is-notice',
  notice_declined: 'is-notice',
  notification_shown: 'is-notice',
  notification_opened: 'is-notice',
  notification_link: 'is-notice',
  notification_dismissed: 'is-notice',
  notification_created: 'is-study',
  notification_edited: 'is-study',
  notification_stopped: 'is-deleted',
  playlist_created: 'is-study',
  playlist_edited: 'is-study',
  playlist_archived: 'is-deleted',
  playlist_deleted: 'is-deleted',
  playlist_opened: 'is-notice',
  playlist_kept: 'is-saved',
  playlist_skipped: 'is-notice',
  playlist_removed: 'is-deleted',
  playlist_item_opened: 'is-saved',
  user_playlist_created: 'is-saved',
  user_playlist_edited: 'is-study',
  user_playlist_deleted: 'is-deleted',
  meal_labels_changed: 'is-study',
  admin_role_given: 'is-study',
  admin_role_removed: 'is-deleted',
  recovery_unlocked: 'is-tracking',
  guest_mode_changed: 'is-study',
  signed_out_everywhere: 'is-account',
  admin_download: 'is-saved',
}

const LIST = 'M4 6h12M4 11h12M4 16h7'
const SHIELD = 'M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z'
const DOWNLOAD = 'M12 3v12M7 10l5 5 5-5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2'
const LEAF = 'M5 20c0-9 5.5-15 15-15 0 9.5-6 15-15 15zM5 20l9-9'
const TRASH = 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3'

const paths: Record<ActivityType, React.ReactNode> = {
  book_saved: <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5zM4 19.5A1.5 1.5 0 0 0 5.5 21H20" />,
  joined: <path d="M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M19 8v6M16 11h6" />,
  book_deleted: <path d={TRASH} />,
  item_removed: <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5zM4 19.5A1.5 1.5 0 0 0 5.5 21H20M9 10.5h6" />,
  book_printed: <path d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z" />,
  book_downloaded: <path d={DOWNLOAD} />,
  account_deleted: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-7 8-7s8 3 8 7M17 3l4 4M21 3l-4 4" />,
  research_erased: <path d="M4 7h16M6 7l1 13h10l1-13M9 7V4h6v3M9.5 11.5l5 5M14.5 11.5l-5 5" />,
  tracking_on: <path d="M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01" />,
  tracking_off: <path d="M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01M4 4l16 16" />,
  study_started: <path d="M9 3h6M10 3v6l-5 9.5A1.7 1.7 0 0 0 6.5 21h11a1.7 1.7 0 0 0 1.5-2.5L14 9V3" />,
  study_ended: <path d="M9 3h6M10 3v6l-5 9.5A1.7 1.7 0 0 0 6.5 21h11a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7.5 15h9" />,
  study_renamed: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  study_deleted: <path d={TRASH} />,
  notice_joined: <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0" />,
  notice_declined: <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0" />,
  notification_shown: <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
  notification_opened: <path d="M3 10l9-6 9 6v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 10l9 6 9-6" />,
  notification_link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  notification_dismissed: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 9l6 6M15 9l-6 6" />,
  notification_created: <path d="M6 8a6 6 0 0 1 9-5.2M18 8c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0M19 2v6M16 5h6" />,
  notification_edited: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  notification_stopped: <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0M3 3l18 18" />,
  playlist_created: <path d={`${LIST}M18 13v6M15 16h6`} />,
  playlist_edited: <path d="M4 6h12M4 11h7M4 16h4M11 20h3l7-7-3-3-7 7z" />,
  playlist_archived: <path d="M3 4h18v5H3zM5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4" />,
  playlist_deleted: <path d={TRASH} />,
  playlist_opened: <path d={`${LIST}M15 14.5v6l5-3z`} />,
  playlist_kept: <path d={`${LIST}M14.5 17.5l2 2 4-4.5`} />,
  playlist_skipped: <path d={`${LIST}M15 14l5 5M20 14l-5 5`} />,
  playlist_removed: <path d={`${LIST}M15 17.5h5`} />,
  playlist_item_opened: <path d={LEAF} />,
  user_playlist_created: <path d={`${LIST}M18 13v6M15 16h6`} />,
  user_playlist_edited: <path d="M4 6h12M4 11h7M4 16h4M11 20h3l7-7-3-3-7 7z" />,
  user_playlist_deleted: <path d={TRASH} />,
  meal_labels_changed: <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01" />,
  admin_role_given: <path d={`${SHIELD}M9 12l2 2 4-4`} />,
  admin_role_removed: <path d={`${SHIELD}M9 12h6`} />,
  recovery_unlocked: <path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 7.5-2M12 15v2" />,
  guest_mode_changed: <path d="M7 7h10a5 5 0 0 1 0 10H7A5 5 0 0 1 7 7zM16 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
  signed_out_everywhere: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  admin_download: <path d={DOWNLOAD} />,
}

export function ActivityIcon({ type }: { type: ActivityType }) {
  return (
    <span className={`av-icon ${tone[type] ?? 'is-study'}`} aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        {paths[type]}
      </svg>
    </span>
  )
}