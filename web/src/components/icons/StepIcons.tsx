// Simple line icons for the "How VeggieBook works" steps on the Welcome
// screen, plus the back arrow used over the photo on the auth screens.
// Decorative: each sits next to a text label that says the same thing.

type IconProps = { className?: string }

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

// Step 1: pick the vegetable you have.
export function SproutIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 21v-9" />
      <path d="M12 12C12 8 9 5 4 5c0 4 3 7 8 7z" />
      <path d="M12 14c0-3 2.5-6 8-6 0 3.5-3 6-8 6z" />
    </Svg>
  )
}

// Step 2: find recipes for it.
export function BowlIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 11h18a9 9 0 0 1-18 0z" />
      <path d="M9 21h6" />
      <path d="M9 4v3" />
      <path d="M12 3v4" />
      <path d="M15 4v3" />
    </Svg>
  )
}

// Step 3: keep the ones you like in your book.
export function OpenBookIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z" />
      <path d="M12 6.5v13" />
    </Svg>
  )
}

// The same arrow as the Back button in the green header.
export function BackArrowIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}