import { coverSrc } from '../utils/coverSrc'

// A book as it appears in the library, matching the original app: the
// vegetable's photo fills the card, the chosen cover sits as a small square
// inset on the right, and the book's name runs along the bottom.
//
// Used on the home screen and as the live preview on the cover screen, so
// users see their book exactly as it will look before they save it.

type Props = {
  title: string
  // The vegetable's photo. Null while the vegetable list is still loading.
  background: string | null
  // The chosen cover: a preset path or an uploaded data URL.
  cover: string
  onClick?: () => void
}

export function BookCard({ title, background, cover, onClick }: Props) {
  const content = (
    <>
      {background && (
        <img className="book-card-bg" src={coverSrc(background)} alt="" />
      )}
      <img className="book-card-cover" src={coverSrc(cover)} alt="" />
      <span className="book-card-name">{title}</span>
    </>
  )

  // Home cards will open the book once that screen exists, so they become
  // buttons when given a click handler. The preview is never clickable.
  if (onClick) {
    return (
      <button type="button" className="book-card" onClick={onClick}>
        {content}
      </button>
    )
  }
  return <div className="book-card">{content}</div>
}