import type { AnalyticsData } from '../../../types/analytics'
import { Panel } from '../../common/Panel'
import { CoverBreakdown } from '../CoverBreakdown'
import { KeptRemovedBar } from '../KeptRemovedBar'
import { RankedList } from '../RankedList'

// Everything about saved books: what was picked, what was kept, what was
// taken out later, and the covers.

type Props = {
  data: AnalyticsData
}

function takenOut(removed: number) {
  return removed > 0 ? `${removed} taken out` : null
}

export function BooksTab({ data }: Props) {
  const s = data.summary

  return (
    <>
      <div className="panel-grid">
        <Panel icon="leaf" title="Vegetables">
          <RankedList
            emptyText="No VeggieBooks yet."
            total={s.veggieBooks}
            items={data.vegetables.map((v) => ({
              key: v.code,
              label: v.name,
              image: v.image,
              count: v.books,
            }))}
          />
        </Panel>

        <Panel icon="sparkle" title="Secrets categories">
          <RankedList
            emptyText="No Secrets Books yet."
            total={s.secretsBooks}
            items={data.secretCategories.map((c) => ({
              key: String(c.id),
              label: c.name,
              image: c.image,
              count: c.books,
            }))}
          />
        </Panel>
      </div>

      <Panel icon="swap" title="Kept and taken out">
        <div className="split-grid">
          <KeptRemovedBar label="Recipes" kept={s.recipesKept} removed={s.recipesRemoved} />
          <KeptRemovedBar label="Secrets" kept={s.secretsKept} removed={s.secretsRemoved} />
        </div>
      </Panel>

      <div className="panel-grid">
        <Panel icon="list" title="Most kept recipes">
          <RankedList
            mode="count"
            emptyText="No recipes kept yet."
            items={data.topRecipes.map((r) => ({
              key: String(r.id),
              label: r.title,
              sub: r.code,
              image: r.photo,
              count: r.kept,
              note: takenOut(r.removed),
            }))}
          />
        </Panel>

        <Panel icon="sparkle" title="Most kept secrets">
          <RankedList
            mode="count"
            emptyText="No secrets kept yet."
            items={data.topSecrets.map((t) => ({
              key: String(t.id),
              label: t.title,
              sub: t.number === null ? null : `#${t.number}`,
              image: t.image,
              count: t.kept,
              note: takenOut(t.removed),
            }))}
          />
        </Panel>
      </div>

      <Panel icon="camera" title="Covers">
        <CoverBreakdown
          builtIn={s.builtInCovers}
          personal={s.personalCovers}
          topCovers={data.topCovers}
        />
      </Panel>
    </>
  )
}