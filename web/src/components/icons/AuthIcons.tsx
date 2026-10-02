// Icons for the account screens. Inline rather than an icon package: five
// shapes do not justify a dependency, and these ship with the bundle.
//
// `as const` on the two string literals: without it TypeScript widens them
// to `string`, and React types focusable as Booleanish, so the spread stops
// being assignable to SVGProps.

const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
}

export function MailIcon() {
  return (
    <svg className="pill-icon" {...base}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7.5 8.5 6 8.5-6" />
    </svg>
  )
}

export function LockIcon() {
  return (
    <svg className="pill-icon" {...base}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export function EyeIcon({ off }: { off?: boolean }) {
  return (
    <svg {...base} width={20} height={20}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="m4 20 16-16" />}
    </svg>
  )
}

export function LeafIcon() {
  return (
    <svg {...base} width={20} height={20}>
      <path d="M4 20c0-8 6-14 16-14 0 10-6 14-16 14z" />
      <path d="M4 20c4-4 7-6 11-7.5" />
    </svg>
  )
}

export function ArrowIcon() {
  return (
    <svg {...base} strokeWidth={2.2}>
      <path d="M5 12h13" />
      <path d="m12 6 6 6-6 6" />
    </svg>
  )
}