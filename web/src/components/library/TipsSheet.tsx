import { useEffect, useRef } from 'react'
import '../../styles/book-tips.css'
import { COMMON } from '../../i18n/strings/common'
import { useStrings } from '../../i18n/useStrings'
import type { PlaylistTip } from '../../utils/playlistsApi'
import { ChevronRightIcon, LeafIcon } from '../icons/LibraryIcons'

// The list of a VeggieBook's tips. On a phone it slides up from the bottom;
// on wider screens it is a centered dialog, like the notification pop-up.
// Tapping a tip opens it. Close, a tap outside, or Escape closes the list.

type Props = {
  title: string
  tips: PlaylistTip[]
  onOpen: (index: number) => void
  onClose: () => void
}

export function TipsSheet({ title, tips, onOpen, onClose }: Props) {
  const common = useStrings(COMMON)
  const firstRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    firstRef.current?.focus()

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
          <h2 className="bt-title" id="bt-sheet-title">
            {title}
          </h2>
          <button type="button" className="bt-close" aria-label={common.close} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <ul className="bt-list">
          {tips.map((tip, i) => (
            <li key={tip.id}>
              <button ref={i === 0 ? firstRef : undefined} type="button" className="bt-row" onClick={() => onOpen(i)}>
                <span className="bt-leaf" aria-hidden="true">
                  <LeafIcon />
                </span>
                <span className="bt-row-title">{tip.title}</span>
                <ChevronRightIcon className="bt-chevron" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}