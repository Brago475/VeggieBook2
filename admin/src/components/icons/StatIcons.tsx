// Icons for the analytics screens: number cards and panel headers. Inline
// SVG, the same style as NavIcons.tsx, taking the text color.

export type StatIconName =
  | 'users'
  | 'book'
  | 'sparkle'
  | 'list'
  | 'image'
  | 'globe'
  | 'refresh'
  | 'leaf'
  | 'camera'
  | 'bulb'
  | 'activity'
  | 'question'
  | 'table'
  | 'chart'
  | 'swap'
  | 'chevron'

const paths: Record<StatIconName, React.ReactNode> = {
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18 14.3c2.1.7 3.5 2.8 3.5 5.7" />
    </>
  ),
  book: (
    <>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z" />
      <path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </>
  ),
  list: (
    <>
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <path d="M4.5 6h.01" />
      <path d="M4.5 12h.01" />
      <path d="M4.5 18h.01" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 16-5-5-9 9" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9z" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.7-4.3L3 9" />
      <path d="M3 4v5h5" />
      <path d="M4 13a8 8 0 0 0 14.7 4.3L21 15" />
      <path d="M21 20v-5h-5" />
    </>
  ),
  leaf: (
    <>
      <path d="M12 21v-8" />
      <path d="M12 13c0-4.5 3-8 8-8 0 5-3.5 8-8 8z" />
      <path d="M12 15c0-3.5-2.5-6-6.5-6 0 4 2.5 6 6.5 6z" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </>
  ),
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  question: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 2.3-2.4 3.8" />
      <path d="M12 17h.01" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M9 4v16" />
    </>
  ),
  chart: (
    <>
      <path d="M3 21h18" />
      <path d="M6 17v-5" />
      <path d="M11 17V7" />
      <path d="M16 17v-8" />
      <path d="M21 17V4" />
    </>
  ),
  swap: (
    <>
      <path d="M7 4 3 8l4 4" />
      <path d="M3 8h14" />
      <path d="m17 20 4-4-4-4" />
      <path d="M21 16H7" />
    </>
  ),
  chevron: <path d="m9 6 6 6-6 6" />,
}

type Props = {
  name: StatIconName
  size?: number
}

export function StatIcon({ name, size = 20 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}