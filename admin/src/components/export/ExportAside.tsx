import type { RecentDownload } from '../../hooks/useRecentDownloads'
import { fullDateTime } from '../studies/studyFormat'
import { formatGuide } from './exportFormats'

// Side column: which format to choose, recent downloads, and the privacy
// note.

type Props = {
  recent: RecentDownload[]
}

export function ExportAside({ recent }: Props) {
  return (
    <aside className="ex-aside">
      <section className="ex-card is-small" aria-labelledby="ex-guide">
        <h2 id="ex-guide" className="ex-aside-title">
          Which format?
        </h2>
        {formatGuide.map((g) => (
          <div key={g.name} className="ex-guide">
            <strong>{g.name}</strong>
            <span>{g.text}</span>
          </div>
        ))}
      </section>

      <section className="ex-card is-small" aria-labelledby="ex-recent">
        <h2 id="ex-recent" className="ex-aside-title">
          Recent downloads
        </h2>
        <span className="ex-aside-note">On this browser only</span>
        {recent.length === 0 ? (
          <p className="ex-empty">Nothing downloaded yet.</p>
        ) : (
          recent.map((r) => (
            <div key={r.at} className="ex-recent">
              <strong>{r.label}</strong>
              <span>{fullDateTime(r.at)}</span>
            </div>
          ))
        )}
      </section>

      <p className="ex-privacy">
        Every file is keyed by the anonymous research ID. Admin accounts, guests, and books saved while tracking was off
        are never included.
      </p>
    </aside>
  )
}