import { useState } from 'react'
import type { PickedItem, PlaylistOptions } from '../../types/playlists'
import { ItemChooser } from './ItemChooser'

// Hand-picks the items for a new playlist in the notification editor.
// Back drops the changes; Done keeps them.

type Props = {
  options: PlaylistOptions
  initial: PickedItem[]
  onBack: () => void
  onDone: (items: PickedItem[]) => void
}

export function ChooseItems({ options, initial, onBack, onDone }: Props) {
  const [chosen, setChosen] = useState<PickedItem[]>(initial)

  return (
    <div className="ps-choose">
      <div className="ps-choose-head">
        <button type="button" className="ps-link" onClick={onBack}>
          &#8249; Back
        </button>
        <strong>Choose items</strong>
        <button type="button" className="st-button is-green" onClick={() => onDone(chosen)}>
          Done ({chosen.length})
        </button>
      </div>

      <ItemChooser options={options} chosen={chosen} onChange={setChosen} />
    </div>
  )
}