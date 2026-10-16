// Line icons for the All Data page, drawn in the current text color.
// Decorative only: every icon sits next to a word that says the same thing.

export type AllDataIconName =
  | 'book'
  | 'lock'
  | 'people'
  | 'calendar'
  | 'pot'
  | 'list'
  | 'check'
  | 'out'
  | 'layers'
  | 'sheet'
  | 'file'
  | 'refresh'
  | 'filter'
  | 'search'
  | 'left'
  | 'right'
  | 'down'
  | 'close'

const paths: Record<AllDataIconName, string[]> = {
  book: ['M2 5.5c2.5-1.3 5.5-1.3 8 0v14c-2.5-1.3-5.5-1.3-8 0z', 'M22 5.5c-2.5-1.3-5.5-1.3-8 0v14c2.5-1.3 5.5-1.3 8 0z', 'M10 5.5h4'],
  lock: ['M6 11h12v10H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3', 'M12 15v2'],
  people: ['M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5', 'M16 4.3a3.5 3.5 0 0 1 0 6.4', 'M18 14.8c2 .6 3.3 2.4 3.6 5.2'],
  calendar: ['M4 6h16v15H4z', 'M4 10h16', 'M8 3v5', 'M16 3v5'],
  pot: ['M4 10h16v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z', 'M2 10h20', 'M9 6.5V5h6v1.5', 'M12 5V3'],
  list: ['M9 6h11', 'M9 12h11', 'M9 18h11', 'M4.5 6h.01', 'M4.5 12h.01', 'M4.5 18h.01'],
  check: ['M20 6 9 17l-5-5'],
  out: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v6H4V6h6'],
  layers: ['M12 3 2 8l10 5 10-5z', 'M2 13l10 5 10-5', 'M2 18l10 5 10-5'],
  sheet: ['M5 3h10l4 4v14H5z', 'M15 3v4h4', 'M8.5 11l5 6', 'M13.5 11l-5 6'],
  file: ['M6 3h9l4 4v14H6z', 'M15 3v4h4', 'M9 13h6', 'M9 17h6'],
  refresh: ['M21 12a9 9 0 1 1-2.64-6.36', 'M21 3v6h-6'],
  filter: ['M3 5h18l-7 8.5V19l-4 2v-7.5z'],
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M20 20l-3.5-3.5'],
  left: ['M15 18l-6-6 6-6'],
  right: ['M9 6l6 6-6 6'],
  down: ['M6 9l6 6 6-6'],
  close: ['M6 6l12 12', 'M18 6 6 18'],
}

type Props = {
  name: AllDataIconName
  size?: number
  className?: string
}

export function AllDataIcon({ name, size = 18, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}