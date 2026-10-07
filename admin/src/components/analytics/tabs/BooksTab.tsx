import type { AnalyticsData } from '../../../types/analytics'
import { plural } from '../../../utils/math'
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
  return removed > 0 ? `Taken out later ${plural(removed, 'time')}` : null
}

export function BooksTab({ data }: Props) {
  const s = data.summary

  return (
    <>
      <div className="panel-grid">
        <Panel title="Vegetables picked" description="Every vegetable, by number of VeggieBooks.">
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

        <Panel title="Secrets categories picked" description="Every category, by number of Secrets Books.">
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

      <Panel title="Kept and taken out" description="What happens to items after a book is saved.">
        <div className="split-grid">
          <KeptRemovedBar label="Recipes" kept={s.recipesKept} removed={s.recipesRemoved} />
          <KeptRemovedBar label="Secrets" kept={s.secretsKept} removed={s.secretsRemoved} />
        </div>
      </Panel>

      <div className="panel-grid">
        <Panel title="Most kept recipes" description="Top 10, by number of books that keep them.">
          <RankedList
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

        <Panel title="Most kept secrets" description="Top 10, by number of books that keep them.">
          <RankedList
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

      <Panel
        title="Covers"
        description="Built-in covers versus personal photos, and the built-in covers used most. Personal photos are never shown."
      >
        <CoverBreakdown
          builtIn={s.builtInCovers}
          personal={s.personalCovers}
          topCovers={data.topCovers}
        />
      </Panel>
    </>
  )
}