import { useEffect, useState } from 'react'
import { ActivityChart } from '../components/analytics/ActivityChart'
import { AgeChart } from '../components/analytics/AgeChart'
import { CoverBreakdown } from '../components/analytics/CoverBreakdown'
import { DescriptivesTable } from '../components/analytics/DescriptivesTable'
import { QuestionBreakdown } from '../components/analytics/QuestionBreakdown'
import { RankedList } from '../components/analytics/RankedList'
import type { AnalyticsData } from '../types/analytics'
import { api } from '../utils/api'
import { formatDateTime } from '../utils/format'
import '../styles/analytics.css'
import '../styles/overview.css'

// Analytics from the data the app already keeps: accounts and saved books.
// Real accounts only; guests are left out. No account is named here.
//
// Study tracking (time per question, sessions) will add more once the IRB
// is approved; it is separate and stays off until then.

function percent(part: number, whole: number) {
  return whole === 0 ? 0 : Math.round((part / whole) * 100)
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api<AnalyticsData>('/admin/analytics')
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    )
  }

  if (!data) return <p className="muted">Loading...</p>

  const s = data.summary
  const totalBooks = s.veggieBooks + s.secretsBooks
  const recipesPerBook = data.descriptives.find((d) => d.variable === 'Recipes per VeggieBook')

  const stats = [
    { label: 'Accounts', value: String(s.accounts) },
    { label: 'VeggieBooks saved', value: String(s.veggieBooks) },
    { label: 'Secrets Books saved', value: String(s.secretsBooks) },
    {
      label: 'Avg. recipes per VeggieBook',
      value: recipesPerBook?.mean === null || recipesPerBook === undefined ? 'n/a' : recipesPerBook.mean.toFixed(1),
    },
    { label: 'Personal covers', value: `${percent(s.personalCovers, totalBooks)}%` },
    { label: 'Books in Spanish', value: `${percent(s.spanishBooks, totalBooks)}%` },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="muted">
            From saved books in real accounts. Guests are not included. Updated{' '}
            {formatDateTime(data.generatedAt)}.
          </p>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((st) => (
          <div key={st.label} className="card stat">
            <span className="stat-value">{st.value}</span>
            <span className="stat-label">{st.label}</span>
          </div>
        ))}
      </div>

      <section className="card panel">
        <h2 className="section-title">Activity, last 12 weeks</h2>
        <ActivityChart weeks={data.weeks} />
      </section>

      <div className="analytics-grid">
        <section className="card panel">
          <h2 className="section-title">Vegetables picked</h2>
          <RankedList
            emptyText="No VeggieBooks yet."
            items={data.vegetables.map((v) => ({
              key: v.code,
              label: v.name,
              image: v.image,
              count: v.books,
            }))}
          />
        </section>

        <section className="card panel">
          <h2 className="section-title">Secrets categories picked</h2>
          <RankedList
            emptyText="No Secrets Books yet."
            items={data.secretCategories.map((c) => ({
              key: String(c.id),
              label: c.name,
              image: c.image,
              count: c.books,
            }))}
          />
        </section>
      </div>

      <section className="card panel">
        <h2 className="section-title">Covers</h2>
        <CoverBreakdown
          builtIn={s.builtInCovers}
          personal={s.personalCovers}
          topCovers={data.topCovers}
        />
      </section>

      <div className="analytics-grid">
        <section className="card panel">
          <h2 className="section-title">Most kept recipes</h2>
          <p className="muted small panel-note">
            {s.recipesKept} kept, {s.recipesRemoved} taken out later
          </p>
          <RankedList
            emptyText="No recipes kept yet."
            items={data.topRecipes.map((r) => ({
              key: String(r.id),
              label: r.title,
              sub: r.code,
              image: r.photo,
              count: r.kept,
              note: r.removed > 0 ? `Taken out later ${r.removed} time${r.removed === 1 ? '' : 's'}` : null,
            }))}
          />
        </section>

        <section className="card panel">
          <h2 className="section-title">Most kept secrets</h2>
          <p className="muted small panel-note">
            {s.secretsKept} kept, {s.secretsRemoved} taken out later
          </p>
          <RankedList
            emptyText="No secrets kept yet."
            items={data.topSecrets.map((t) => ({
              key: String(t.id),
              label: t.title,
              sub: t.number === null ? null : `#${t.number}`,
              image: t.image,
              count: t.kept,
              note: t.removed > 0 ? `Taken out later ${t.removed} time${t.removed === 1 ? '' : 's'}` : null,
            }))}
          />
        </section>
      </div>

      <div className="analytics-grid">
        <section className="card panel">
          <h2 className="section-title">Age ranges</h2>
          <AgeChart ageRanges={data.ageRanges} />
        </section>

        <section className="card panel">
          <h2 className="section-title">Books by language</h2>
          <RankedList
            emptyText="No books yet."
            items={[
              { key: 'en', label: 'English', count: s.englishBooks },
              { key: 'es', label: 'Spanish', count: s.spanishBooks },
            ]}
          />
          <p className="muted small panel-note">
            {s.extraCopies} extra {s.extraCopies === 1 ? 'copy' : 'copies'} asked for across all
            books.
          </p>
        </section>
      </div>

      <h2 className="section-title block-title">Answers to the VeggieBook questions</h2>
      <QuestionBreakdown questions={data.questions} totalBooks={s.veggieBooks} />

      <section className="card panel">
        <h2 className="section-title">Descriptive statistics</h2>
        <DescriptivesTable rows={data.descriptives} />
      </section>
    </>
  )
}