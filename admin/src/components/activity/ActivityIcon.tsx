import type { ActivityType } from '../../types/activity'

// Colored icon tile for each activity type.

const tone: Record<ActivityType, string> = {
  book_saved: 'is-saved',
  joined: 'is-joined',
  book_deleted: 'is-deleted',
  account_deleted: 'is-account',
  tracking_on: 'is-tracking',
  tracking_off: 'is-tracking',
  study_started: 'is-study',
  study_ended: 'is-study',
  study_renamed: 'is-study',
  study_deleted: 'is-deleted',
  notice_joined: 'is-notice',
  notice_declined: 'is-notice',
}

const paths: Record<ActivityType, React.ReactNode> = {
  book_saved: <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5zM4 19.5A1.5 1.5 0 0 0 5.5 21H20" />,
  joined: <path d="M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M19 8v6M16 11h6" />,
  book_deleted: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  account_deleted: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-7 8-7s8 3 8 7M17 3l4 4M21 3l-4 4" />,
  tracking_on: <path d="M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01" />,
  tracking_off: <path d="M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01M4 4l16 16" />,
  study_started: <path d="M9 3h6M10 3v6l-5 9.5A1.7 1.7 0 0 0 6.5 21h11a1.7 1.7 0 0 0 1.5-2.5L14 9V3" />,
  study_ended: <path d="M9 3h6M10 3v6l-5 9.5A1.7 1.7 0 0 0 6.5 21h11a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7.5 15h9" />,
  study_renamed: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  study_deleted: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  notice_joined: <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0" />,
  notice_declined: <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0" />,
}

export function ActivityIcon({ type }: { type: ActivityType }) {
  return (
    <span className={`av-icon ${tone[type]}`} aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        {paths[type]}
      </svg>
    </span>
  )
}