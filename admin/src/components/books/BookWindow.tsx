import { useEffect, useRef, useState } from 'react'
import { useBookDetail } from '../../hooks/useBookContent'
import type { BookItem } from '../../types/books'
import { AllDataIcon } from '../alldata/AllDataIcons'
import { BookFacts } from './BookFacts'
import { VbBookList } from './VbBookList'
import { VbRecipeView } from './VbRecipeView'
import { VbSecretView } from './VbSecretView'

// A book opened from the grid, in a window over the page.
//
//   Left    the book the way VeggieBook shows it: the list of recipes or
//           secrets, and one of them opened (Back to book returns to the
//           same place in the list)
//   Right   About this book (BookFacts.tsx)
//
// Escape or the close button closes it. Previous and Next move through the
// books in the page's current order, filters included. While it is open,
// the page behind it doesn't scroll.

type Props = {
  bookKey: string
  onClose: () => void
  onOpenData: (researchId: string) => void
  onPrev: (() => void) | null
  onNext: (() => void) | null
}

export function BookWindow({ bookKey, onClose, onOpenData, onPrev, onNext }: Props) {
  const { detail, error, loading } = useBookDetail(bookKey)
  const [item, setItem] = useState<BookItem | null>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const listScroll = useRef(0)

  // A different book starts on its list, at the top.
  const [shownKey, setShownKey] = useState(bookKey)
  if (shownKey !== bookKey) {
    setShownKey(bookKey)
    setItem(null)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  useEffect(() => {
    leftRef.current?.scrollTo(0, 0)
  }, [bookKey])

  function open(next: BookItem) {
    listScroll.current = leftRef.current?.scrollTop ?? 0
    setItem(next)
    leftRef.current?.scrollTo(0, 0)
  }

  function back() {
    setItem(null)
    const y = listScroll.current
    requestAnimationFrame(() => leftRef.current?.scrollTo(0, y))
  }

  const ready = detail !== null && detail.book.key === bookKey ? detail : null
  const out = item !== null && ready !== null && ready.removedItems.includes(item)
  const index = item !== null && ready !== null ? ready.keptItems.indexOf(item) : -1
  const noun = item?.type === 'secret' ? 'Secret' : 'Recipe'
  const position = out ? 'Taken out' : `${noun} ${index + 1} of ${ready?.keptItems.length ?? 0}`

  return (
    <div className="bw-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bw" role="dialog" aria-modal="true" aria-label="Book">
        <div className="bw-left vb" ref={leftRef}>
          <div className="vb-header">
            {item && (
              <button type="button" className="vb-back" onClick={back} aria-label="Back to book">
                <AllDataIcon name="left" size={20} />
              </button>
            )}
            <span className="vb-logo">
              <span className="vb-logo-word">
                <span className="vb-logo-veggie">Veggie</span>
                <span className="vb-logo-book">Book</span>
              </span>
              <span className="vb-logo-tag">Quick Help for Meals</span>
            </span>
          </div>

          {!ready && (
            <p className="vb-message">{loading || !error ? 'Opening the book...' : error}</p>
          )}

          {ready && !item && <VbBookList detail={ready} onOpen={open} />}

          {ready && item && (
            <>
              {item.type === 'recipe' ? (
                <VbRecipeView id={item.id} position={position} out={out} />
              ) : ready.secretCategoryId !== null ? (
                <VbSecretView categoryId={ready.secretCategoryId} secretId={item.id} position={position} out={out} />
              ) : (
                <p className="vb-message">This secret's category is missing.</p>
              )}
              <div className="vb-navbar">
                <button type="button" onClick={back}>
                  BACK TO BOOK
                </button>
              </div>
            </>
          )}
        </div>

        <div className="bw-right">
          {ready ? (
            <BookFacts
              detail={ready}
              item={item}
              onClose={onClose}
              onOpenData={() => onOpenData(ready.book.researchId)}
              onPrev={onPrev}
              onNext={onNext}
            />
          ) : (
            <div className="bf">
              <div className="bf-head">
                <h2>About this book</h2>
                <button type="button" className="bf-close" aria-label="Close" onClick={onClose}>
                  <AllDataIcon name="close" size={18} />
                </button>
              </div>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}