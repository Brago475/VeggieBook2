// Icons for the About screen's cards. Inline so the app takes no icon
// dependency. All are decorative: each sits next to a card title that
// already says what the card is about.

type IconProps = { className?: string }

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

// Where it came from: the university that created it.
export function SchoolIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
      <path d="M22 10v6" />
    </Svg>
  )
}

// Funding: an award ribbon.
export function AwardIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 13.9 7 22l5-3 5 3-1.5-8.1" />
    </Svg>
  )
}

// The original phone apps.
export function PhoneIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </Svg>
  )
}

// Rebuilt as a website: a browser window.
export function BrowserIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="2.5" y="4" width="19" height="16" rx="2.5" />
      <path d="M2.5 9h19" />
      <path d="M6 6.5h.01" />
      <path d="M9 6.5h.01" />
    </Svg>
  )
}

// Research: a paper with lines of text.
export function PaperIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </Svg>
  )
}

// Small arrow after a link that opens another site in a new tab.
export function ExternalIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </Svg>
  )
}