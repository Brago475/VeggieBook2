import { useCallback, useState } from 'react'
import type { AnalyticsData } from '../../../types/analytics'
import { percent, plural } from '../../../utils/math'
import { NumberCard } from '../../common/NumberCard'
import { Panel } from '../../common/Panel'
import { ContentDrawer } from '../../content/ContentDrawer'
import { RecipeView } from '../../content/RecipeView'
import { SecretView } from '../../content/SecretView'
import { KeptRemovedBar } from '../KeptRemovedBar'
import { PictureGrid } from '../PictureGrid'

// Books: what was picked, what was kept, covers, and what was taken out.
// A kept recipe or secret opens in a side panel when clicked.

type Props = {
  data: AnalyticsData
}

type Opened = { kind: 'recipe' | 'secret'; id: number } | null

function relative(count: number, max: number) {
  return max === 0 ? 0 : (count / max) * 100
}

export function BooksTab({ data }: Props) {
  const [opened, setOpened] = useState<Opened>(null)
  const close = useCallback(() => setOpened(null), [])

  const s = data.summary
  const totalBooks = s.veggieBooks + s.secretsBooks
  const maxRecipe = Math.max(0, ...data.topRecipes.map((r) => r.kept))
  const maxSecret = Math.max(0, ...data.topSecrets.map((t) => t.kept))
  const maxCover = Math.max(0, ...data.topCovers.map((c) => c.books))

  return (
    <>
      <section className="section">
        <h2 className="section-title">Vegetables</h2>
        <PictureGrid
          emptyText="No VeggieBooks yet."
          items={data.vegetables.map((v) => ({
            key: v.code,
            image: v.image,
            title: v.name,
            value: `${percent(v.books, s.veggieBooks)}%`,
            detail: plural(v.books, 'book'),
            bar: percent(v.books, s.veggieBooks),
          }))}
        />
      </section>

      <section className="section">
        <h2 className="section-title">Secrets categories</h2>
        <PictureGrid
          emptyText="No Secrets Books yet."
          items={data.secretCategories.map((c) => ({
            key: String(c.id),
            image: c.image,
            title: c.name,
            value: `${percent(c.books, s.secretsBooks)}%`,
            detail: plural(c.books, 'book'),
            bar: percent(c.books, s.secretsBooks),
          }))}
        />
      </section>

      <section className="section">
        <h2 className="section-title">Most kept recipes</h2>
        <PictureGrid
          emptyText="No recipes kept yet."
          onSelect={(key) => setOpened({ kind: 'recipe', id: Number(key) })}
          items={data.topRecipes.map((r) => ({
            key: String(r.id),
            image: r.photo,
            title: r.title,
            code: r.code,
            value: String(r.kept),
            detail: r.kept === 1 ? 'book' : 'books',
            bar: relative(r.kept, maxRecipe),
            warn: r.removed > 0 ? `${r.removed} taken out later` : null,
          }))}
        />
      </section>

      <section className="section">
        <h2 className="section-title">Most kept secrets</h2>
        <PictureGrid
          emptyText="No secrets kept yet."
          onSelect={(key) => setOpened({ kind: 'secret', id: Number(key) })}
          items={data.topSecrets.map((t) => ({
            key: String(t.id),
            image: t.image,
            title: t.title,
            code: t.number === null ? null : `#${t.number}`,
            value: String(t.kept),
            detail: t.kept === 1 ? 'book' : 'books',
            bar: relative(t.kept, maxSecret),
            warn: t.removed > 0 ? `${t.removed} taken out later` : null,
          }))}
        />
      </section>

      <section className="section">
        <h2 className="section-title">Covers</h2>
        <div className="card-grid cols-2">
          <NumberCard
            value={`${percent(s.builtInCovers, totalBooks)}%`}
            label={`Built-in covers, ${plural(s.builtInCovers, 'book')}`}
          />
          <NumberCard
            value={`${percent(s.personalCovers, totalBooks)}%`}
            label={`Personal photos, ${plural(s.personalCovers, 'book')}`}
          />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Most used covers</h2>
        <PictureGrid
          emptyText="No built-in covers used yet."
          items={data.topCovers.map((c) => ({
            key: c.path,
            image: c.path,
            title: c.path.split('/').slice(-2, -1)[0] ?? 'Cover',
            value: String(c.books),
            detail: c.books === 1 ? 'book' : 'books',
            bar: relative(c.books, maxCover),
          }))}
        />
      </section>

      <Panel title="Kept and taken out">
        <div className="split-list">
          <KeptRemovedBar label="Recipes" kept={s.recipesKept} removed={s.recipesRemoved} />
          <KeptRemovedBar label="Secrets" kept={s.secretsKept} removed={s.secretsRemoved} />
        </div>
      </Panel>

      {opened && (
        <ContentDrawer label={opened.kind === 'recipe' ? 'Recipe' : 'Secret'} onClose={close}>
          {opened.kind === 'recipe' ? <RecipeView id={opened.id} /> : <SecretView id={opened.id} />}
        </ContentDrawer>
      )}
    </>
  )
}