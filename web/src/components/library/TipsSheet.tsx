import { useEffect, useRef, useState } from 'react'
import '../../styles/book-tips.css'
import { BOOK } from '../../i18n/strings/book'
import { COMMON } from '../../i18n/strings/common'
import { useStrings } from '../../i18n/useStrings'
import { coverSrc } from '../../utils/coverSrc'
import type { PlaylistTip } from '../../utils/playlistsApi'
import { SafeImage } from '../common/SafeImage'
import { ChevronLeftIcon, ChevronRightIcon, LeafIcon } from '../icons/LibraryIcons'

// A VeggieBook's tips in one pop-up: the list first, then a tip opened in
// place with Previous and Next and a way back to the list. On a phone it
// slides up from the bottom; on wider screens it is a centered dialog, like
// the notification pop-up. Close, a tap outside, or Escape closes it, and
// the book stays where it was.

type Props = {
  vegetableName: string
  tips: PlaylistTip[]
  onClose: () => void
}

export function TipsSheet({ vegetableName, tips, onClose }: Props) {
  const t = useStrings(BOOK)
  const common = useStrings(COMMON)
  const [open, setOpen] = useState<number | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const focusRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  // Each change between the list and a tip starts at the top, with focus on
  // its first control.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
    focusRef.current?.focus()
  }, [open])

  const tip = open !== null ? tips[open] : undefined
  const name = vegetableName || tips[0]?.vegetableName || ''

  return (
    <div className="dialog-overlay bt-overlay" onClick={onClose}>
      <div
        className="dialog bt-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bt-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bt-head">
          {tip ? (
            <button ref={focusRef} type="button" className="bt-back" onClick={() => setOpen(null)}>
              <ChevronLeftIcon />
              {t.allTips}
            </button>
          ) : (
            <h2 className="bt-title" id="bt-sheet-title">
              {t.tipsTitle(name)}
            </h2>
          )}
          <button type="button" className="bt-close" aria-label={common.close} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="bt-body" ref={bodyRef}>
          {tip && open !== null ? (
            <article className="bt-tip">
              <p className="bt-kicker">{t.tipOf(name, open + 1, tips.length)}</p>
              <h2 className="bt-tip-title" id="bt-sheet-title">
                {tip.title}
              </h2>
              {tip.blocks.map((block, i) => (
                <div key={i} className="bt-block">
                  {block.image && <SafeImage className="bt-img" src={coverSrc(block.image)} />}
                  <p>{block.text}</p>
                </div>
              ))}
            </article>
          ) : (
            <ul className="bt-list">
              {tips.map((item, i) => (
                <li key={item.id}>
                  <button
                    ref={i === 0 ? focusRef : undefined}
                    type="button"
                    className="bt-row"
                    onClick={() => setOpen(i)}
                  >
                    <span className="bt-leaf" aria-hidden="true">
                      <LeafIcon />
                    </span>
                    <span className="bt-row-title">{item.title}</span>
                    <ChevronRightIcon className="bt-chevron" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {tip && open !== null && (
          <div className="bt-steps">
            <button type="button" className="account-btn" disabled={open === 0} onClick={() => setOpen(open - 1)}>
              {t.previousTip}
            </button>
            <button
              type="button"
              className="create-btn"
              disabled={open === tips.length - 1}
              onClick={() => setOpen(open + 1)}
            >
              {t.nextTip}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}