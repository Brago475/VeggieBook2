import { useEffect, useState } from 'react'
import type { RecipeDetail } from '../../types/content'
import { api } from '../../utils/api'
import { imageUrl } from '../../utils/images'
import { ContentSection } from './ContentSection'

// One recipe, with the same sections the public site shows: the first
// photo, the story, the summary, ingredients, instructions, notes, and any
// other photos. Loaded from the public /api/recipes/{id}.
//
// Each result is kept with the id it belongs to, so switching recipes never
// shows the previous one's content for a moment.

type Props = {
  id: number
}

type Loaded = {
  id: number
  detail: RecipeDetail | null
  error: string | null
}

export function RecipeView({ id }: Props) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    let cancelled = false
    api<RecipeDetail>(`/recipes/${id}`)
      .then((detail) => {
        if (!cancelled) setLoaded({ id, detail, error: null })
      })
      .catch((err: Error) => {
        if (!cancelled) setLoaded({ id, detail: null, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const current = loaded !== null && loaded.id === id ? loaded : null

  if (!current) return <p className="muted">Loading...</p>
  if (!current.detail) {
    return (
      <p className="error" role="alert">
        {current.error ?? 'This recipe could not be found.'}
      </p>
    )
  }

  const r = current.detail
  const [firstPhoto, ...morePhotos] = r.photos

  const facts = [
    ['Preparation time', r.timeToPrepare],
    ['Cooking time', r.timeToCook],
    ['Servings', r.servings],
    ['Can be made ahead', r.canBeMadeAhead],
    ['Can be frozen', r.canBeFrozen],
    ['Good for leftovers', r.goodForLeftovers],
  ]

  return (
    <article className="content-view">
      {firstPhoto && <img className="content-hero" src={imageUrl(firstPhoto)} alt="" />}

      <p className="content-meta">
        {r.code} · {r.vegetable}
      </p>
      <h2 className="content-title">{r.title}</h2>
      {r.storyLine && <p className="content-lead">{r.storyLine}</p>}

      <ContentSection title="Summary">
        <dl className="content-facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || 'n/a'}</dd>
            </div>
          ))}
        </dl>
      </ContentSection>

      <ContentSection title="Ingredients">
        <ul className="content-list">
          {r.ingredients.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </ContentSection>

      <ContentSection title="Instructions">
        <ol className="content-list">
          {r.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </ContentSection>

      {r.notes.length > 0 && (
        <ContentSection title="Notes">
          <ul className="content-list">
            {r.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </ContentSection>
      )}

      {morePhotos.length > 0 && (
        <ContentSection title="More photos">
          <div className="content-photos">
            {morePhotos.map((path, i) => (
              <img key={`${i}-${path}`} src={imageUrl(path)} alt="" loading="lazy" />
            ))}
          </div>
        </ContentSection>
      )}
    </article>
  )
}