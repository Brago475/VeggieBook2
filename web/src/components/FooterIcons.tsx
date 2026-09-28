// Icon for the footer card: an open book with a sprout growing from it,
// VeggieBook in one picture. Decorative: the card's title says the same.

type IconProps = { className?: string }

export function BookSproutIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {/* Sprout: stem and two leaves */}
      <path d="M15 17V10.5h2V17z" />
      <path d="M15.4 11.2C15.4 7.6 12.8 5 8.6 5c0 3.8 2.8 6.2 6.8 6.2z" />
      <path d="M16.6 10.2c0-3.4 2.5-5.9 6.5-5.9 0 3.6-2.6 5.9-6.5 5.9z" />
      {/* Open book */}
      <path d="M3 15.2c3.9-.4 8 .5 12 2.8V28c-4-2.3-8.1-3.2-12-2.8z" />
      <path d="M29 15.2c-3.9-.4-8 .5-12 2.8V28c4-2.3 8.1-3.2 12-2.8z" />
    </svg>
  )
}