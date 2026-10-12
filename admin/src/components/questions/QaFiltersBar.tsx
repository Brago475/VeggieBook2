import type { QaData } from '../../types/questions'
import { StudyView } from '../alldata/StudyView'
import { NOT_GIVEN, type QaFilters } from './questionMath'

// Study switch plus age range, vegetable, and language filters.

type Props = {
  data: QaData | null
  study: number | null
  onStudy: (study: number | null) => void
  books: number
  value: QaFilters
  onChange: (next: QaFilters) => void
}

export function QaFiltersBar({ data, study, onStudy, books, value, onChange }: Props) {
  const all = data?.books ?? []
  const ages = [...new Set(all.map((b) => b.ageRange ?? NOT_GIVEN))].sort((a, b) =>
    a === NOT_GIVEN ? 1 : b === NOT_GIVEN ? -1 : a.localeCompare(b),
  )
  const vegCodes = new Set(all.map((b) => b.vegetableCode).filter(Boolean))
  const vegetables = (data?.vegetables ?? []).filter((v) => vegCodes.has(v.code))
  const set = (patch: Partial<QaFilters>) => onChange({ ...value, ...patch })

  return (
    <div className="bk-card">
      <StudyView study={study} onStudy={onStudy} books={books} />
      <div className="bk-filter-row">
        <label className="bk-select">
          <span>Age range</span>
          <select value={value.age} onChange={(e) => set({ age: e.target.value })}>
            <option value="">All</option>
            {ages.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="bk-select">
          <span>Vegetable</span>
          <select value={value.vegetable} onChange={(e) => set({ vegetable: e.target.value })}>
            <option value="">All</option>
            {vegetables.map((v) => (
              <option key={v.code} value={v.code}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <label className="bk-select">
          <span>Language</span>
          <select value={value.language} onChange={(e) => set({ language: e.target.value })}>
            <option value="">All</option>
            <option value="en">English</option>
            <option value="es">Spanish</option>
          </select>
        </label>
        {(value.age || value.vegetable || value.language) && (
          <button type="button" className="st-button" onClick={() => onChange({ age: '', vegetable: '', language: '' })}>
            Clear filters
          </button>
        )}
      </div>
      {value.vegetable && <p className="qa-hint">A vegetable filter leaves out Secrets Books, which have no vegetable.</p>}
    </div>
  )
}