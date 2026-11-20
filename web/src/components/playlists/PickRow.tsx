import { coverSrc } from '../../utils/coverSrc'
import { SafeImage } from '../common/SafeImage'
import { PickCheck } from './PickCheck'

// One recipe in the picker. The whole row toggles it. A recipe already in
// the playlist shows a label in place of the check and cannot be picked.

type Props = {
  title: string
  photo: string | null
  meta?: string | null
  on: boolean
  inLabel?: string | null
  onToggle: () => void
}

export function PickRow({ title, photo, meta, on, inLabel, onToggle }: Props) {
  const already = Boolean(inLabel)
  const cls = ['pl-pick', 'pk-row', already ? 'is-in' : on ? 'is-on' : ''].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={cls}
      aria-pressed={already ? undefined : on}
      disabled={already}
      onClick={onToggle}
    >
      <SafeImage className="recipe-thumb" src={photo ? coverSrc(photo) : null} />
      <span className="bp-row-text">
        <span className="pl-pick-title">{title}</span>
        {meta && <span className="bp-row-meta">{meta}</span>}
      </span>
      {already ? <span className="pk-in">{inLabel}</span> : <PickCheck on={on} />}
    </button>
  )
}