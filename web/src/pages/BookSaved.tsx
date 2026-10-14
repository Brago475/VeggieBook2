import { BookCard } from '../components/library/BookCard'
import { SAVED } from '../i18n/strings/saved'
import { useStrings } from '../i18n/useStrings'
import { downloadPdf, printPdf } from '../utils/bookPdf'

// Shown right after a book is saved, in place of home: the book's card,
// then Print, Download PDF, or Skip to the library. Printing or
// downloading keeps this screen up, so a person can do both.

type Props = {
  bookId: string
  title: string
  background: string | null
  cover: string
  label: string
  count: number
  countNoun: 'recipe' | 'secret'
  onDone: () => void
}

export function BookSaved({
  bookId,
  title,
  background,
  cover,
  label,
  count,
  countNoun,
  onDone,
}: Props) {
  const t = useStrings(SAVED)

  return (
    <div className="book-saved">
      <div className="book-saved-check" aria-hidden="true">
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
      </div>

      <h1 className="book-saved-title">{t.title}</h1>
      <p className="book-saved-sub">{t.sub}</p>

      <div className="book-saved-card">
        <BookCard
          title={title}
          background={background}
          cover={cover}
          label={label}
          count={count}
          countNoun={countNoun}
        />
      </div>

      <div className="book-saved-actions">
        <button
          type="button"
          className="book-saved-btn is-primary"
          onClick={() => printPdf({ bookId })}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M6 9V3h12v6" />
            <rect x="3" y="9" width="18" height="8" rx="2" />
            <path d="M7 14h10v7H7z" />
          </svg>
          {t.print}
        </button>

        <button
          type="button"
          className="book-saved-btn"
          onClick={() => downloadPdf({ bookId })}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 3v12" />
            <path d="M7 10l5 5 5-5" />
            <path d="M4 19h16" />
          </svg>
          {t.download}
        </button>

        <button type="button" className="book-saved-skip" onClick={onDone}>
          {t.skip}
        </button>
      </div>
    </div>
  )
}