import type { ReactNode } from 'react'
import { shortAnswer } from '../../utils/answerNames'
import type { BookDetail, BookItem } from '../../types/books'
import { AllDataIcon } from '../alldata/AllDataIcons'
import { itemNoun, kindText, languageText, plural, savedText } from './bookFormat'

// "About this book", beside the book: what a researcher needs that the
// book itself doesn't show.
//
//   facts     research ID, book number, when it was saved, language, cover,
//             the studies running at the time, kept and taken out
//   answers   the person's answers to the questions ("Q2: Latino")
//   item      when a recipe or secret is open: its code and extra copies
//   actions   Open in All Data (searched to this research ID), and the
//             previous and next book in the page's order

type Props = {
  detail: BookDetail
  item: BookItem | null // the recipe or secret open on the left
  onClose: () => void
  onOpenData: () => void
  onPrev: (() => void) | null
  onNext: (() => void) | null
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bf-fact">
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  )
}

export function BookFacts({ detail, item, onClose, onOpenData, onPrev, onNext }: Props) {
  const { book, answers, studies, keptItems, removedItems } = detail
  const extra = keptItems.filter((i) => i.extraCopies > 0)
  const extraCopies = extra.reduce((n, i) => n + i.extraCopies, 0)

  return (
    <aside className="bf" aria-label="About this book">
      <div className="bf-head">
        <h2>About this book</h2>
        <span className={book.kind === 'secrets' ? 'bk-type is-secrets' : 'bk-type'}>{kindText(book)}</span>
        <button type="button" className="bf-close" aria-label="Close" onClick={onClose}>
          <AllDataIcon name="close" size={18} />
        </button>
      </div>

      <div className="bf-facts">
        <Fact label="Research ID">
          <span className="bk-id">{book.researchId}</span>
        </Fact>
        <Fact label="Their book number">{book.bookNo}</Fact>
        <Fact label="Saved">{savedText(book.savedAt)}</Fact>
        <Fact label="Language">{languageText(book.language)}</Fact>
        <Fact label="Cover">{book.personalCover ? 'Personal photo (not shown)' : 'Built-in picture'}</Fact>
        <Fact label="Study">{studies.length === 0 ? 'No study running' : studies.map((s) => s.title).join(', ')}</Fact>
        <Fact label="Kept">
          {plural(keptItems.length, itemNoun(book.kind, 1), itemNoun(book.kind, 2))}
          {extraCopies > 0 && `, ${plural(extraCopies, 'extra copy', 'extra copies')}`}
        </Fact>
        <Fact label="Taken out later">
          <span className={removedItems.length > 0 ? 'bk-out' : undefined}>
            {plural(removedItems.length, itemNoun(book.kind, 1), itemNoun(book.kind, 2))}
          </span>
        </Fact>
      </div>

      {book.kind === 'veggie' && (
        <div className="bf-block">
          <h3>Answers</h3>
          {answers.length === 0 ? (
            <p className="st-muted">No answers picked.</p>
          ) : (
            <div className="bf-answers">
              {answers.map((a) => (
                <span key={`${a.question}-${a.text}`}>
                  Q{a.question}: {shortAnswer(a.text)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {item && (
        <div className="bf-item">
          <strong>This {item.type === 'secret' ? 'secret' : 'recipe'}:</strong>{' '}
          {item.code ? `${item.code}. ` : ''}
          {removedItems.includes(item)
            ? 'Taken out of the book after it was saved.'
            : item.extraCopies > 0
              ? `Kept, with ${plural(item.extraCopies, 'extra copy', 'extra copies')}.`
              : 'Kept.'}
          {item.missing && ' No longer in the app, so only its number is known.'}
        </div>
      )}

      <div className="bf-actions">
        <button type="button" className="st-button" onClick={onOpenData}>
          <AllDataIcon name="sheet" size={16} />
          Open in All Data
        </button>
        <div className="bf-step">
          <button type="button" className="st-button" disabled={!onPrev} onClick={() => onPrev?.()}>
            <AllDataIcon name="left" size={16} />
            Previous book
          </button>
          <button type="button" className="st-button" disabled={!onNext} onClick={() => onNext?.()}>
            Next book
            <AllDataIcon name="right" size={16} />
          </button>
        </div>
        <p className="bf-note">Read only. Admins can't change or delete a person's book.</p>
      </div>
    </aside>
  )
}