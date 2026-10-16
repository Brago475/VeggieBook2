import { useMemo, useState } from 'react'
import { useExportSummary } from '../../hooks/useExportSummary'
import type { ContentLibrary } from '../../types/content'
import type { Participant } from '../../types/participants'
import { exportUrl, type ExportParams } from '../../utils/exportQuery'
import { allFormats } from './exportFormats'
import { ItemPicker, type PickItem } from './ItemPicker'

// Downloads narrowed to one person, one book, chosen recipes or secrets, a
// vegetable, a Secrets category, or dates and ages. Every format holds the
// matching books, with their answers and items.

type Tab = 'participant' | 'book' | 'items' | 'vegetable' | 'category' | 'dates'

const tabs: { id: Tab; label: string }[] = [
  { id: 'participant', label: 'One participant' },
  { id: 'book', label: 'One book' },
  { id: 'items', label: 'Recipes or secrets' },
  { id: 'vegetable', label: 'Vegetable' },
  { id: 'category', label: 'Secret category' },
  { id: 'dates', label: 'Dates and ages' },
]

const LIMIT = 40

type Props = {
  study: number | null
  answers: boolean
  library: ContentLibrary | null
  people: Participant[]
  onDownload: (label: string) => void
}

export function SpecificData({ study, answers, library, people, onDownload }: Props) {
  const [tab, setTab] = useState<Tab>('items')
  const [person, setPerson] = useState('')
  const [bookNo, setBookNo] = useState('')
  const [kind, setKind] = useState<'recipe' | 'secret'>('recipe')
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [vegetable, setVegetable] = useState('')
  const [category, setCategory] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [age, setAge] = useState('')

  const ids = useMemo(() => new Set(people.map((p) => p.researchId)), [people])
  const ages = useMemo(
    () => [...new Set(people.map((p) => p.ageRange).filter((a): a is string => !!a))].sort(),
    [people],
  )
  const personId = person.trim().toUpperCase()

  const items: PickItem[] = useMemo(() => {
    if (!library) return []
    const needle = search.trim().toLowerCase()
    const vegName = new Map(library.vegetables.map((v) => [v.code, v.name]))
    const catName = new Map(library.categories.map((c) => [c.id, c.name]))
    const list: PickItem[] =
      kind === 'recipe'
        ? library.recipes.map((r) => ({
            id: r.id,
            title: r.title,
            sub: r.code,
            tag: vegName.get(r.vegetable) ?? r.vegetable,
            image: r.photo,
            uses: r.kept + r.takenOut,
          }))
        : library.secrets.map((s) => ({
            id: s.id,
            title: s.headline,
            sub: `#${s.number}`,
            tag: s.category === null ? 'No category' : catName.get(s.category) ?? `Category ${s.category}`,
            image: s.image,
            uses: s.kept + s.takenOut,
          }))
    const matches = needle
      ? list.filter((i) => i.title.toLowerCase().includes(needle) || (i.sub ?? '').toLowerCase().includes(needle))
      : list
    return [...matches.filter((i) => picked.has(i.id)), ...matches.filter((i) => !picked.has(i.id))]
  }, [library, kind, search, picked])

  const selection: ExportParams | null = useMemo(() => {
    switch (tab) {
      case 'participant':
        return ids.has(personId) ? { participant: personId } : null
      case 'book': {
        const n = Number(bookNo)
        return ids.has(personId) && Number.isInteger(n) && n >= 1 ? { participant: personId, book: n } : null
      }
      case 'items':
        if (picked.size === 0) return null
        return kind === 'recipe' ? { recipes: [...picked] } : { secrets: [...picked] }
      case 'vegetable':
        return vegetable ? { vegetable } : null
      case 'category':
        return category ? { category: Number(category) } : null
      case 'dates':
        return from || to || age ? { from, to, age } : null
    }
  }, [tab, ids, personId, bookNo, picked, kind, vegetable, category, from, to, age])

  const params = selection ? { ...selection, study, answers } : null
  const { summary, loading } = useExportSummary(params ? { ...params, answers: false } : null)
  const tabLabel = tabs.find((t) => t.id === tab)?.label ?? ''
  const ready = params !== null && summary !== null && summary.books > 0

  function toggle(id: number) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function changeKind(next: 'recipe' | 'secret') {
    setKind(next)
    setPicked(new Set())
    setSearch('')
  }

  let status = 'Choose what to download.'
  if (params && loading) status = 'Counting...'
  else if (params && summary)
    status =
      summary.books === 0
        ? 'No tracked books match.'
        : `${summary.books.toLocaleString()} ${summary.books === 1 ? 'book' : 'books'} from ${summary.participants.toLocaleString()} ${summary.participants === 1 ? 'person' : 'people'}`

  return (
    <section className="ex-card" aria-labelledby="ex-specific">
      <div className="ex-card-head">
        <div>
          <h2 id="ex-specific" className="ex-card-title">
            Specific data
          </h2>
          <p className="ex-card-sub">
            Pick exactly what you need. Every file holds the matching books, with their answers and items.
          </p>
        </div>
      </div>

      <div className="ex-card-body">
        <div className="ex-tabs" role="tablist" aria-label="What to download">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'ex-tab is-on' : 'ex-tab'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <datalist id="ex-people">
          {people.map((p) => (
            <option key={p.researchId} value={p.researchId} />
          ))}
        </datalist>

        {(tab === 'participant' || tab === 'book') && (
          <div className="ex-row">
            <label className="ex-field is-wide">
              Research ID
              <input
                list="ex-people"
                placeholder="VB2-..."
                value={person}
                onChange={(e) => setPerson(e.target.value)}
              />
            </label>
            {tab === 'book' && (
              <label className="ex-field">
                Book number
                <input type="number" min={1} placeholder="1" value={bookNo} onChange={(e) => setBookNo(e.target.value)} />
              </label>
            )}
            {person && !ids.has(personId) && <span className="ex-hint">No participant has this research ID.</span>}
          </div>
        )}

        {tab === 'items' && (
          <>
            <div className="ex-row">
              <label className="ex-field">
                Type
                <select value={kind} onChange={(e) => changeKind(e.target.value as 'recipe' | 'secret')}>
                  <option value="recipe">Recipes</option>
                  <option value="secret">Secrets</option>
                </select>
              </label>
              <label className="ex-field is-wide">
                Find
                <input
                  type="search"
                  placeholder={kind === 'recipe' ? 'Search by title or code...' : 'Search by headline or number...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              {picked.size > 0 && (
                <button type="button" className="ex-link" onClick={() => setPicked(new Set())}>
                  Clear {picked.size} picked
                </button>
              )}
            </div>
            {library ? (
              <ItemPicker items={items} picked={picked} onToggle={toggle} limit={LIMIT} />
            ) : (
              <p className="ex-empty">Loading the content...</p>
            )}
          </>
        )}

        {tab === 'vegetable' && (
          <div className="ex-row">
            <label className="ex-field">
              Vegetable
              <select value={vegetable} onChange={(e) => setVegetable(e.target.value)}>
                <option value="">Choose a vegetable</option>
                {library?.vegetables.map((v) => (
                  <option key={v.code} value={v.code}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {tab === 'category' && (
          <div className="ex-row">
            <label className="ex-field">
              Secret category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Choose a category</option>
                {library?.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {tab === 'dates' && (
          <div className="ex-row">
            <label className="ex-field">
              From
              <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="ex-field">
              To
              <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
            </label>
            <label className="ex-field">
              Age range
              <select value={age} onChange={(e) => setAge(e.target.value)}>
                <option value="">Any age</option>
                {ages.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="ex-foot">
          <div className="ex-foot-text">
            <strong>{status}</strong>
            <span>{study === null ? 'From all data.' : `Only books from Study ${study}.`}</span>
          </div>
          <div className="ex-fmts">
            {allFormats.map((f) =>
              ready && params ? (
                <a
                  key={f.format}
                  className="ex-fmt is-white"
                  href={exportUrl('all-data/export', params, { format: f.format })}
                  download
                  onClick={() => onDownload(`Specific data (${tabLabel}), ${f.label}`)}
                >
                  {f.label}
                </a>
              ) : (
                <span key={f.format} className="ex-fmt is-white is-off" aria-disabled="true">
                  {f.label}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  )
}