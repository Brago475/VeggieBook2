// Decorative two-leaf sprig. Pure ornament: hidden from screen readers and
// colored by currentColor, so each place that uses it sets its own tint.

type Props = {
  className?: string
}

export function LeafDecor({ className = '' }: Props) {
  return (
    <svg
      className={`leaf-decor ${className}`.trim()}
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M60 118 C60 92 58 72 52 50"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M52 50 C22 48 8 24 14 4 C40 8 58 26 52 50 Z" fill="currentColor" />
      <path d="M58 80 C70 54 94 44 116 50 C108 76 84 90 58 80 Z" fill="currentColor" />
    </svg>
  )
}