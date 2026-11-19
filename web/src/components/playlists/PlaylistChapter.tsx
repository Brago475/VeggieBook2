import { useId } from 'react'
import { coverSrc } from '../../utils/coverSrc'
import type { PlaylistEntry } from '../../utils/playlistsApi'
import { SafeImage } from '../common/SafeImage'
import { ChevronRightIcon, LeafIcon } from '../icons/LibraryIcons'

// One vegetable in an open playlist, as a chapter that folds open and
// closed: a round photo, "Chapter n" over the vegetable's name, a count,
// and the recipes and tips as rows with a spine, green for a recipe and
// yellow for a tip.

type Props = {
  kicker: string
  name: string
  items: PlaylistEntry[]
  open: boolean
  recipeLabel: string
  tipLabel: string
  onToggle: () => void
  onOpenItem: (item: PlaylistEntry) => void
}

export function PlaylistChapter({
  kicker,
  name,
  items,
  open,
  recipeLabel,
  tipLabel,
  onToggle,
  onOpenItem,
}: Props) {
  const rowsId = useId()
  const cover = items.find((i) => i.kind === 'recipe' && i.photo)
  const coverPhoto = cover && cover.kind === 'recipe' ? cover.photo : null

  return (
    <div className={open ? 'pl-chapter is-open' : 'pl-chapter'}>
      <h2 className="pl-chapter-heading">
        <button
          type="button"
          className="pl-chapter-head"
          aria-expanded={open}
          aria-controls={rowsId}
          onClick={onToggle}
        >
          {coverPhoto ? (
            <SafeImage className="pl-chapter-avatar" src={coverSrc(coverPhoto)} />
          ) : (
            <span className="pl-chapter-avatar" aria-hidden="true" />
          )}
          <span className="pl-chapter-names">
            <span className="pl-chapter-kicker">{kicker}</span>
            <span className="pl-chapter-name">{name}</span>
          </span>
          <span className="pl-chapter-count">{items.length}</span>
          <ChevronRightIcon className="pl-chapter-chevron" />
        </button>
      </h2>

      {open && (
        <ul id={rowsId} className="pl-chapter-rows">
          {items.map((item) => (
            <li key={`${item.kind}:${item.id}`}>
              <button
                type="button"
                className={`pl-entry is-${item.kind}`}
                onClick={() => onOpenItem(item)}
              >
                <span className="pl-entry-spine" aria-hidden="true" />
                {item.kind === 'recipe' ? (
                  <SafeImage
                    className="pl-entry-thumb"
                    src={item.photo ? coverSrc(item.photo) : null}
                  />
                ) : (
                  <span className="pl-entry-thumb is-tip" aria-hidden="true">
                    <LeafIcon />
                  </span>
                )}
                <span className="pl-entry-text">
                  <span className="pl-entry-title">{item.title}</span>
                  <span className="pl-entry-meta">{item.kind === 'tip' ? tipLabel : recipeLabel}</span>
                </span>
                <ChevronRightIcon className="pl-entry-chevron" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}