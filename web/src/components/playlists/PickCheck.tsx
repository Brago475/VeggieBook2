// Round check mark for pickable rows.

export function PickCheck({ on }: { on: boolean }) {
  return (
    <span className="pl-check" aria-hidden="true">
      {on && (
        <svg viewBox="0 0 24 24" focusable="false">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}