import { coverSrc } from '../../utils/coverSrc'
import { useSlideshow } from '../../hooks/useSlideshow'
import { SafeImage } from '../common/SafeImage'
import { BookIcon, PersonIcon, TeamIcon } from './PlaylistIcons'

// The top of an open playlist, styled like its card in the list: recipe
// photos that cross-fade every 20 seconds, where it came from top right,
// and the name, the spaced label and the counts bottom left.

type Props = {
  name: string
  label: string
  summary: string
  badge: string
  source: 'own' | 'team'
  photos: string[]
}

const SLIDE_MS = 20000

export function PlaylistHero({ name, label, summary, badge, source, photos }: Props) {
  const active = useSlideshow(photos.length, SLIDE_MS)

  return (
    <header className="pl-hero">
      {photos.length === 0 ? (
        <SafeImage className="pl-card-photo is-on" src={null} />
      ) : (
        photos.map((p, i) => (
          <SafeImage
            key={p}
            className={i === active ? 'pl-card-photo is-on' : 'pl-card-photo'}
            src={coverSrc(p)}
          />
        ))
      )}

      {photos.length > 1 && (
        <span className="pl-card-dots" aria-hidden="true">
          {photos.map((p, i) => (
            <span key={p} className={i === active ? 'is-on' : undefined} />
          ))}
        </span>
      )}

      <span className="pl-card-badge">
        {source === 'own' ? <PersonIcon /> : <TeamIcon />}
        {badge}
      </span>

      <div className="pl-hero-text">
        <h1 className="book-card-name pl-hero-name">{name}</h1>
        <span className="book-card-label">{label}</span>
        <span className="book-card-count">
          <BookIcon className="book-card-count-icon" />
          {summary}
        </span>
      </div>
    </header>
  )
}