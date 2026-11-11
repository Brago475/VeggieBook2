import type { ReactNode } from 'react'
import { coverSrc } from '../../utils/coverSrc'
import type { PlaylistTip } from '../../utils/playlistsApi'
import { SafeImage } from '../common/SafeImage'

// One tip: a small heading line (the vegetable, unless kicker is given),
// the title, then its text blocks, with a picture where the block has one.
// Used by playlists and by a VeggieBook's tips; children go at the end,
// for a book's Previous and Next.

type Props = {
  tip: PlaylistTip
  kicker?: string
  children?: ReactNode
}

export function TipView({ tip, kicker, children }: Props) {
  return (
    <article className="recipe-detail pl-tip">
      <p className="pl-kicker">{kicker ?? tip.vegetableName}</p>
      <h2>{tip.title}</h2>
      {tip.blocks.map((block, i) => (
        <div key={i} className="pl-tip-block">
          {block.image && <SafeImage className="pl-tip-img" src={coverSrc(block.image)} />}
          <p>{block.text}</p>
        </div>
      ))}
      {children}
    </article>
  )
}