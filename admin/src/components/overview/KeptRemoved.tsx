import type { Overview } from '../../types/admin'

// Recipes and secrets kept in saved books vs taken out later, as two
// split bars: green for kept, light orange for taken out. Items skipped
// during the review before saving are not stored, so they don't count.

type Props = {
  items: Overview['items']
}

function Split({ label, kept, removed }: { label: string; kept: number; removed: number }) {
  const total = kept + removed
  const keptPct = total > 0 ? Math.round((kept / total) * 100) : 0

  return (
    <div className="split">
      <div className="split-line">
        <span className="split-label">{label}</span>
        <span className="muted small">{total > 0 ? `${keptPct}% kept` : 'None yet'}</span>
      </div>
      <div className="split-bar">
        {total > 0 && (
          <>
            <div className="split-kept" style={{ width: `${(kept / total) * 100}%` }} />
            <div className="split-removed" style={{ width: `${(removed / total) * 100}%` }} />
          </>
        )}
      </div>
      <div className="split-counts">
        <span>
          <i className="swatch is-kept" /> {kept.toLocaleString()} kept
        </span>
        <span>
          <i className="swatch is-removed" /> {removed.toLocaleString()} taken out later
        </span>
      </div>
    </div>
  )
}

export function KeptRemoved({ items }: Props) {
  return (
    <div className="splits">
      <Split label="Recipes" kept={items.recipesKept} removed={items.recipesRemoved} />
      <Split label="Secrets" kept={items.secretsKept} removed={items.secretsRemoved} />
      <p className="muted small">Recipes skipped before saving aren't stored, so they aren't counted here.</p>
    </div>
  )
}