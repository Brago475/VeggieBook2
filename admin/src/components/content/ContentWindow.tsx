import { useEffect, useRef } from 'react'
import { AllDataIcon } from '../alldata/AllDataIcons'
import { VbRecipeView } from '../books/VbRecipeView'
import { VbSecretView } from '../books/VbSecretView'
import type { ContentItem } from './contentItems'
import '../../styles/books.css'
import '../../styles/books-vb.css'

// One recipe or secret opened over the page: on the left the way the app
// shows it, on the right its details and how often it was kept. Escape,
// the close button or a click outside closes it.

type Props = {
  item: ContentItem
  onClose: () => void
  onPrev: (() => void) | null
  onNext: (() => void) | null
}

export function ContentWindow({ item, onClose, onPrev, onNext }: Props) {
  const leftRef = useRef<HTMLDivElement>(null)

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
  }, [item.key])

  const recipe = item.kind === 'recipe'
  const noun = recipe ? 'recipe' : 'secret'
  const total = item.kept + item.takenOut
  const keptPct = total ? (item.kept / total) * 100 : 0
  const outPct = total ? (item.takenOut / total) * 100 : 0

  return (
    <div className="bw-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bw" role="dialog" aria-modal="true" aria-label={item.title}>
        <div className="bw-left vb" ref={leftRef}>
          <div className="vb-header">
            <span className="vb-logo">
              <span className="vb-logo-word">
                <span className="vb-logo-veggie">Veggie</span>
                <span className="vb-logo-book">Book</span>
              </span>
              <span className="vb-logo-tag">Quick Help for Meals</span>
            </span>
          </div>

          {recipe ? (
            <VbRecipeView id={item.id} position={item.sub ?? 'Recipe'} out={false} />
          ) : item.subject ? (
            <VbSecretView
              categoryId={Number(item.subject)}
              secretId={item.id}
              position={item.sub ?? 'Secret'}
              out={false}
            />
          ) : (
            <p className="vb-message">This secret has no category, so it can't be shown the way the app shows it.</p>
          )}
        </div>

        <div className="bw-right">
          <div className="bf ct-side">
            <div className="bf-head">
              <h2>About this {noun}</h2>
              <button type="button" className="bf-close" aria-label="Close" onClick={onClose}>
                <AllDataIcon name="close" size={18} />
              </button>
            </div>

            <dl className="ct-facts">
              <div>
                <dt>{recipe ? 'Code' : 'Number'}</dt>
                <dd>{item.sub ?? 'None'}</dd>
              </div>
              <div>
                <dt>{recipe ? 'Vegetable' : 'Category'}</dt>
                <dd>{item.tag}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{item.active ? 'In the app' : 'Retired'}</dd>
              </div>
              <div>
                <dt>Content ID</dt>
                <dd>{item.id}</dd>
              </div>
            </dl>

            <div className="ct-usage">
              <span className="ct-usage-title">In saved books</span>
              <div className="ct-usage-line">
                <span>Kept</span>
                <strong className="ct-kept">{item.kept.toLocaleString()}</strong>
              </div>
              <div className="ct-usage-line">
                <span>Taken out later</span>
                <strong className="ct-out">{item.takenOut.toLocaleString()}</strong>
              </div>
              <div className="ct-bar" aria-hidden="true">
                <span className="ct-bar-kept" style={{ width: `${keptPct}%` }} />
                <span className="ct-bar-out" style={{ width: `${outPct}%` }} />
              </div>
              <span className="ct-usage-note">Tracked accounts only</span>
            </div>

            <div className="ct-nav">
              <button type="button" className="st-button" onClick={onPrev ?? undefined} disabled={!onPrev}>
                Previous
              </button>
              <button type="button" className="st-button" onClick={onNext ?? undefined} disabled={!onNext}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}