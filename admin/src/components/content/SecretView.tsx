import { useEffect, useState } from 'react'
import type { SecretDetail } from '../../types/content'
import { api } from '../../utils/api'
import { imageUrl } from '../../utils/images'
import { ContentSection } from './ContentSection'

// One secret, with the same parts the public site shows: the category, the
// headline, the illustration and the secret, Why It Works, and any links or
// printable planner.
//
// The illustrations have words drawn into them, so they are shown whole,
// never cropped.

type Props = {
  id: number
}

type Loaded = {
  id: number
  detail: SecretDetail | null
  error: string | null
}

export function SecretView({ id }: Props) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    let cancelled = false
    api<SecretDetail>(`/admin/content/secrets/${id}`)
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
        {current.error ?? 'This secret could not be found.'}
      </p>
    )
  }

  const s = current.detail
  const hasExtras = s.links.length > 0 || s.attachment !== null

  return (
    <article className="content-view">
      <p className="content-meta">
        #{s.number}
        {s.category && ` · ${s.category}`}
        {!s.active && ' · retired'}
      </p>
      <h2 className="content-title">{s.headline}</h2>

      {s.image && <img className="content-figure" src={imageUrl(s.image)} alt="" />}
      {s.body && <p className="content-text">{s.body}</p>}

      <ContentSection title="Why It Works">
        <p className="content-text">{s.whyItWorks}</p>
      </ContentSection>

      {hasExtras && (
        <ContentSection title="Additional information">
          <ul className="content-list">
            {s.attachment && (
              <li>
                <a href={imageUrl(s.attachment)} target="_blank" rel="noopener noreferrer">
                  Printable planner (PDF)
                </a>
              </li>
            )}
            {s.links.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label || link.url}
                </a>
              </li>
            ))}
          </ul>
        </ContentSection>
      )}
    </article>
  )
}