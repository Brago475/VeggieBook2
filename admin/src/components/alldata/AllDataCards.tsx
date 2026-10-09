// The four numbers at the top of the All Data page.

export type AllDataCard = {
  label: string
  value: string
  mark: string
  note?: string
  warn?: boolean
}

type Props = {
  cards: AllDataCard[]
}

export function AllDataCards({ cards }: Props) {
  return (
    <div className="ad-cards">
      {cards.map((c) => (
        <div key={c.label} className="ad-card">
          <div className="ad-card-head">
            <span className="ad-card-mark" aria-hidden="true">
              {c.mark}
            </span>
            <span className="ad-card-label">{c.label}</span>
          </div>
          <div className="ad-card-body">
            <span className={c.warn ? 'ad-card-value is-warn' : 'ad-card-value'}>{c.value}</span>
            {c.note && <span className="ad-card-note">{c.note}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}