import { useState } from 'react'
import { SafeImage } from '../components/common/SafeImage'
import { BookCard } from '../components/library/BookCard'
import { useBookDetail } from '../hooks/useBookDetail'
import { useSecretBook } from '../hooks/useSecretBook'
import { SAVED } from '../i18n/strings/saved'
import { useStrings } from '../i18n/useStrings'
import { downloadPdf, printPdf } from '../utils/bookPdf'
import { coverSrc } from '../utils/coverSrc'

// Shown right after a book is saved, in place of home, in up to two steps:
//
//   extras  only when recipes or secrets were picked for extra copies:
//           one picked prints or downloads on its own; several print or
//           download together in one file. NEXT goes to the book step.
//   book    print or download the whole book, or Skip to the library.
//
// With nothing picked, or if the book cannot be loaded, it opens on the
// book step. Printing or downloading keeps the screen up, so a person can
// do more than one.

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

type Extra = { id: number; title: string; image: string | null }

function CheckBadge() {
  return (
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
  )
}

function PrintIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 9V3h12v6" />
      <rect x="3" y="9" width="18" height="8" rx="2" />
      <path d="M7 14h10v7H7z" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  )
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
  const isSecrets = countNoun === 'secret'

  // Only the hook for this kind of book loads anything.
  const veggie = useBookDetail(isSecrets ? null : bookId)
  const secretBook = useSecretBook(isSecrets ? bookId : null)
  const [step, setStep] = useState<'extras' | 'book'>('extras')

  const loading = isSecrets ? secretBook.loading : veggie.loading
  const failed = isSecrets ? secretBook.error !== null : veggie.error !== null

  let extras: Extra[] = []
  if (isSecrets) {
    const picked = new Set(
      (secretBook.book?.secrets ?? []).filter((s) => s.extraCopies > 0).map((s) => s.id),
    )
    extras = secretBook.secrets
      .filter((s) => picked.has(s.id))
      .map((s) => ({ id: s.id, title: s.headline, image: s.image }))
  } else {
    extras = (veggie.book?.recipes ?? [])
      .filter((r) => r.extraCopies > 0)
      .map((r) => ({ id: r.id, title: r.title, image: r.photo }))
  }

  const hadExtras = extras.length > 0

  // While the book loads, the heading holds the screen.
  if (step === 'extras' && loading) {
    return (
      <div className="book-saved" role="status" aria-busy="true">
        <CheckBadge />
        <h1 className="book-saved-title">{t.title}</h1>
        <p className="book-saved-sub">{t.loading}</p>
      </div>
    )
  }

  if (step === 'extras' && !failed && hadExtras) {
    const one = extras.length === 1 ? extras[0] : null
    const target = one
      ? isSecrets
        ? { bookId, secretId: one.id }
        : { bookId, recipeId: one.id }
      : { bookId, extras: true }

    return (
      <div className="book-saved">
        <CheckBadge />
        <h1 className="book-saved-title">{t.title}</h1>
        <p className="book-saved-sub">
          {one ? t.extraOne(countNoun) : t.extraMany(extras.length, countNoun)}
        </p>

        {one ? (
          <div className="book-saved-extra">
            <SafeImage
              className={`book-saved-extra-photo${isSecrets ? ' is-secret' : ''}`}
              src={one.image ? coverSrc(one.image) : null}
            />
            <p className="book-saved-extra-name">{one.title}</p>
          </div>
        ) : (
          <ul className="book-saved-extras">
            {extras.map((x) => (
              <li key={x.id}>
                <SafeImage
                  className={`book-saved-extras-thumb${isSecrets ? ' is-secret' : ''}`}
                  src={x.image ? coverSrc(x.image) : null}
                />
                <span>{x.title}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="book-saved-actions">
          <button
            type="button"
            className="book-saved-btn is-primary"
            onClick={() => printPdf(target)}
          >
            <PrintIcon />
            {one ? t.printOne(countNoun) : t.printMany(extras.length, countNoun)}
          </button>
          <button
            type="button"
            className="book-saved-btn"
            onClick={() => downloadPdf(target)}
          >
            <DownloadIcon />
            {one ? t.downloadOne(countNoun) : t.downloadMany(extras.length, countNoun)}
          </button>
        </div>

        <div className="book-saved-next">
          <button type="button" className="book-saved-next-btn" onClick={() => setStep('book')}>
            {t.next}
          </button>
          <span className="book-saved-hint">{t.nextHint}</span>
        </div>
      </div>
    )
  }

  // The whole book. After the extras step it reads as the next step;
  // otherwise it is the saved screen itself.
  const afterExtras = step === 'book' && hadExtras

  return (
    <div className="book-saved">
      {!afterExtras && <CheckBadge />}
      <h1 className="book-saved-title">{afterExtras ? t.wholeTitle : t.title}</h1>
      <p className="book-saved-sub">{afterExtras ? t.wholeSub : t.sub}</p>

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
          <PrintIcon />
          {t.printBook}
        </button>
        <button
          type="button"
          className="book-saved-btn"
          onClick={() => downloadPdf({ bookId })}
        >
          <DownloadIcon />
          {t.downloadBook}
        </button>
        <button type="button" className="book-saved-skip" onClick={onDone}>
          {t.skip}
        </button>
      </div>
    </div>
  )
}