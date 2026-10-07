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
  return removed > 0 ? `${removed} taken out later` : null
}

export function BooksTab({ data }: Props) {
  const s = data.summary

  return (
    <>
      <Panel icon="leaf" title="Vegetables" description="Share of VeggieBooks for each vegetable.">
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

      <Panel icon="sparkle" title="Secrets categories" description="Share of Secrets Books for each category.">
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

      <Panel icon="list" title="Most kept recipes" description="The recipes saved in the most VeggieBooks.">
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

      <Panel icon="sparkle" title="Most kept secrets" description="The secrets saved in the most Secrets Books.">
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

      <Panel icon="swap" title="Kept and taken out">
        <div className="split-grid">
          <KeptRemovedBar label="Recipes" kept={s.recipesKept} removed={s.recipesRemoved} />
          <KeptRemovedBar label="Secrets" kept={s.secretsKept} removed={s.secretsRemoved} />
        </div>
      </Panel>

      <Panel icon="camera" title="Covers" description="Built-in covers versus personal photos.">
        <CoverBreakdown
          builtIn={s.builtInCovers}
          personal={s.personalCovers}
          topCovers={data.topCovers}
        />
      </Panel>
    </>
  )
}