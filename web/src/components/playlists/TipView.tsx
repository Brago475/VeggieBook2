import { coverSrc } from '../../utils/coverSrc'
import type { PlaylistTip } from '../../utils/playlistsApi'
import { SafeImage } from '../common/SafeImage'

// One tip from a playlist: the vegetable, the heading, then its text blocks,
// with a picture where the block has one.

export function TipView({ tip }: { tip: PlaylistTip }) {
  return (
    <article className="recipe-detail pl-tip">
      <p className="pl-kicker">{tip.vegetableName}</p>
      <h2>{tip.title}</h2>
      {tip.blocks.map((block, i) => (
        <div key={i} className="pl-tip-block">
          {block.image && <SafeImage className="pl-tip-img" src={coverSrc(block.image)} />}
          <p>{block.text}</p>
        </div>
      ))}
    </article>
  )
}