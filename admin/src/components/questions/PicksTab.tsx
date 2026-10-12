import type { QaBook, QaData } from '../../types/questions'
import { SafeImg } from '../books/SafeImg'
import { pct, topKept, type TopItem } from './questionMath'

// Picks tab: vegetables and Secrets categories picked, and the most kept
// recipes and secrets with kept versus taken out later.

type Props = {
  data: QaData
  books: QaBook[]
}

function PickCard({ name, image, count, total, unit }: { name: string; image: string | null; count: number; total: number; unit: string }) {
  const share = pct(count, total)
  return (
    <div className="qa-pick">
      <SafeImg className="qa-pick-img" path={image} />
      <strong>{name}</strong>
      <span className="qa-pick-value">
        <strong>{share}%</strong> {count.toLocaleString()} {count === 1 ? unit : `${unit}s`}
      </span>
      <span className="qa-meter">
        <span style={{ width: `${share}%` }} />
      </span>
    </div>
  )
}

function TopList({ title, items }: { title: string; items: TopItem[] }) {
  return (
    <section className="qa-panel">
      <h2>{title}</h2>
      <p className="qa-sub">Green kept, orange taken out later</p>
      {items.length === 0 ? (
        <p className="st-muted">None yet.</p>
      ) : (
        <ul className="qa-top">
          {items.map((t) => {
            const all = t.kept + t.removed
            return (
              <li key={t.id}>
                <SafeImg className="qa-top-img" path={t.image} />
                <span className="qa-top-text">
                  {t.code && <span className="qa-code">{t.code}</span>}
                  <strong>{t.title}</strong>
                  <span className="qa-split-bar">
                    <span className="is-kept" style={{ width: `${pct(t.kept, all)}%` }} />
                    <span className="is-out" style={{ width: `${pct(t.removed, all)}%` }} />
                  </span>
                </span>
                <span className="qa-top-count">
                  <strong>{t.kept} kept</strong>
                  <span>{t.removed} taken out</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export function PicksTab({ data, books }: Props) {
  const veggie = books.filter((b) => b.kind === 'veggie')
  const secrets = books.filter((b) => b.kind === 'secrets')

  const vegCount = (code: string) => veggie.filter((b) => b.vegetableCode === code).length
  const vegetables = data.vegetables
    .filter((v) => v.active || vegCount(v.code) > 0)
    .map((v) => ({ ...v, count: vegCount(v.code) }))
    .sort((a, b) => b.count - a.count)

  const catCount = (id: number) => secrets.filter((b) => b.secretCategoryId === id).length
  const categories = data.categories.map((c) => ({ ...c, count: catCount(c.id) })).sort((a, b) => b.count - a.count)

  return (
    <div className="qa-stack">
      <section className="qa-panel">
        <div className="qa-panel-head">
          <h2>Vegetables picked</h2>
          <span>Share of VeggieBooks</span>
        </div>
        <div className="qa-picks">
          {vegetables.map((v) => (
            <PickCard key={v.code} name={v.name} image={v.image} count={v.count} total={veggie.length} unit="book" />
          ))}
        </div>
      </section>

      <section className="qa-panel">
        <div className="qa-panel-head">
          <h2>Secrets categories picked</h2>
          <span>Share of Secrets Books</span>
        </div>
        <div className="qa-picks is-categories">
          {categories.map((c) => (
            <PickCard key={c.id} name={c.name} image={c.image} count={c.count} total={secrets.length} unit="book" />
          ))}
        </div>
      </section>

      <div className="qa-two">
        <TopList title="Most kept recipes" items={topKept(veggie, data.recipes, 'Recipe')} />
        <TopList title="Most kept secrets" items={topKept(secrets, data.secrets, 'Secret')} />
      </div>
    </div>
  )
}