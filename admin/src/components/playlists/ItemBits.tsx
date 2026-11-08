import type { MealKey, PlaylistKind, PlaylistMeal } from '../../types/playlists'
import { imageUrl } from '../../utils/images'
import { NavIcon } from '../icons/NavIcons'

// Small pieces shared by the playlist screens.

export function KindTag({ kind }: { kind: PlaylistKind }) {
  return <span className={`pl-kind is-${kind}`}>{kind === 'tip' ? 'Tip' : 'Recipe'}</span>
}

export function ItemThumb({ kind, photo }: { kind: PlaylistKind; photo: string | null | undefined }) {
  if (photo) {
    return <img className="pl-thumb" src={imageUrl(photo)} alt="" loading="lazy" />
  }
  return (
    <span className="pl-thumb" aria-hidden="true">
      <NavIcon name={kind === 'tip' ? 'leaf' : 'content'} size={18} />
    </span>
  )
}

export function MealTags({ meals, names }: { meals: MealKey[]; names: PlaylistMeal[] }) {
  if (meals.length === 0) return null
  return (
    <span className="pl-meals">
      {meals.map((m) => (
        <span key={m} className="pl-meal">
          {names.find((n) => n.key === m)?.en ?? m}
        </span>
      ))}
    </span>
  )
}