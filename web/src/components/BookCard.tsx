import { coverSrc } from '../utils/coverSrc'

// A book as it appears in the library, matching the original app: the
// vegetable's photo fills the card, the chosen cover sits as a small
// inset on the right, and the book's name runs along the bottom.
//
// Used on the home screen, at the top of a saved book, and as the live
// preview on the cover screen, so users see their book exactly as it will
// look before they save it.
//
// The lines under the name are optional, so each screen shows only what
// it needs:
//   label     a small spaced-out word under a short rule ("VeggieBook")
//   subtitle  a short line ("Recipes, tips and more")
//   count     the number of recipes, with a book icon

type Props = {
  title: string
  // The vegetable's photo. Null while the vegetable list is still loading.
  background: string | null
  // The chosen cover: a preset path or an uploaded data URL.
  cover: string
  label?: string
  subtitle?: string
  count?: number
  onClick?: () => void
}

export function BookCard({
  title,
  background,
  cover,
  label,
  subtitle,
  count,
  onClick,
}: Props) {
  const content = (
    <>
      {background && (
        <img className="book-card-bg" src={coverSrc(background)} alt="" />
      )}
      <img className="book-card-cover" src={coverSrc(cover)} alt="" />

      <span className="book-card-text">
        <span className="book-card-name">{title}</span>

        {label && <span className="book-card-label">{label}</span>}

        {subtitle && <span className="book-card-subtitle">{subtitle}</span>}

        {count !== undefined && (
          <span className="book-card-count">
            <svg
              className="book-card-count-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5v13"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            {count} {count === 1 ? 'recipe' : 'recipes'}
          </span>
        )}
      </span>
    </>
  )

  // Home cards open the book, so they become buttons when given a click
  // handler. The preview and the book view's card are never clickable.
  if (onClick) {
    return (
      <button type="button" className="book-card" onClick={onClick}>
        {content}
      </button>
    )
  }
  return <div className="book-card">{content}</div>
}