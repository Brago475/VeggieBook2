import { SafeImg } from '../books/SafeImg'
import type { ContentItem } from './contentItems'

// One recipe or secret in the Content grid. Secret artwork has words drawn
// in, so it is shown whole instead of cropped.

type Props = {
  item: ContentItem
  onOpen: () => void
}

export function ContentTile({ item, onOpen }: Props) {
  const secret = item.kind === 'secret'

  return (
    <button type="button" className="ct-tile" onClick={onOpen}>
      <span className={secret ? 'ct-media is-art' : 'ct-media'}>
        {item.image ? <SafeImg className="ct-img" path={item.image} /> : <span className="ct-noimg">No picture</span>}
      </span>
      <span className="ct-body">
        <span className="ct-tags">
          <span className={secret ? 'ct-tag is-secret' : 'ct-tag'}>{item.tag}</span>
          {!item.active && <span className="ct-tag is-retired">Retired</span>}
        </span>
        <span className="ct-title">{item.title}</span>
        {item.sub && <span className="ct-sub">{item.sub}</span>}
        <span className="ct-counts">
          <span className="ct-kept">Kept {item.kept.toLocaleString()}</span>
          <span className="ct-out">Taken out {item.takenOut.toLocaleString()}</span>
        </span>
      </span>
    </button>
  )
}