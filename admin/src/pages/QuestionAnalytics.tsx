import { useMemo, useState } from 'react'
import { AllDataIcon } from '../components/alldata/AllDataIcons'
import { StatCard } from '../components/common/StatCard'
import { TopbarActions } from '../components/layout/TopbarSlot'
import { CompareTab } from '../components/questions/CompareTab'
import { PicksTab } from '../components/questions/PicksTab'
import { QaFiltersBar } from '../components/questions/QaFiltersBar'
import { QuestionsTab } from '../components/questions/QuestionsTab'
import { StatisticsTab } from '../components/questions/StatisticsTab'
import { applyFilters, noQaFilters, shares, veggieOf, type QaFilters } from '../components/questions/questionMath'
import { useQuestionData } from '../hooks/useQuestionData'
import { questionName, shortAnswer } from '../utils/answerNames'
import { allDataDownload } from '../utils/allDataQuery'
import { noFilters } from '../utils/researchQuery'
import '../styles/studies.css'
import '../styles/books.css'
import '../styles/questions.css'

// Admin Question Analytics page: answer shares per question, picks,
// two-question comparison, and descriptive statistics. Data is loaded once
// per study and filtered client-side.

type Tab = 'questions' | 'picks' | 'compare' | 'statistics'

const tabs: { id: Tab; label: string }[] = [
  { id: 'questions', label: 'Questions' },
  { id: 'picks', label: 'Picks' },
  { id: 'compare', label: 'Compare' },
  { id: 'statistics', label: 'Statistics' },
]

/** Monday of the current week, "yyyy-MM-dd", local time. */
function thisWeek(): string {
  const d = new Date()
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function QuestionAnalytics() {
  const [study, setStudy] = useState<number | null>(null)
  const { data, error, loading, reload } = useQuestionData(study)
  const [filters, setFilters] = useState<QaFilters>(noQaFilters)
  const [tab, setTab] = useState<Tab>('questions')

  const books = useMemo(() => applyFilters(data?.books ?? [], filters), [data, filters])
  const veggie = useMemo(() => veggieOf(books), [books])

  const summary = useMemo(() => {
    const week = thisWeek()
    const answers = veggie.reduce((n, b) => n + b.answers.length, 0)
    const answersThisWeek = veggie.filter((b) => b.week === week).reduce((n, b) => n + b.answers.length, 0)
    const choices = (data?.questions ?? []).reduce((n, q) => n + q.choices.length, 0)
    let top: { label: string; count: number; percent: number } | null = null
    for (const q of data?.questions ?? []) {
      const best = shares(q, veggie)[0]
      if (best && best.count > 0 && (!top || best.count > top.count)) {
        top = { label: `${shortAnswer(best.text)} (Q${q.no} ${questionName(q.no)})`, count: best.count, percent: best.percent }
      }
    }
    return { answers, answersThisWeek, choices, top }
  }, [data, veggie])

  const studyExtra: Record<string, string> = study === null ? {} : { study: String(study) }

  return (
    <div className="qa-page">
      <TopbarActions>
        <a
          className="st-button is-green"
          href={allDataDownload('export', noFilters, { format: 'xlsx', ...studyExtra })}
          title="All answers, one row per book, in one Excel workbook"
          download
        >
          <AllDataIcon name="sheet" size={17} />
          Download Excel
        </a>
        <button type="button" className="st-button" onClick={() => void reload()}>
          <AllDataIcon name="refresh" size={17} className={loading ? 'bk-spin is-spinning' : 'bk-spin'} />
          {loading ? 'Updating...' : 'Refresh'}
        </button>
      </TopbarActions>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {data && (
        <div className="bk-stats">
          <StatCard
            index={0}
            icon="book"
            label="VeggieBooks answered"
            value={veggie.length}
            chip={study === null ? 'All data' : `Study ${study}`}
            note="With tracking on"
          />
          <StatCard
            index={1}
            icon="answers"
            label="Answers recorded"
            value={summary.answers}
            chip={`+${summary.answersThisWeek} this week`}
            chipUp={summary.answersThisWeek > 0}
            note={veggie.length ? `About ${Math.round(summary.answers / veggie.length)} per VeggieBook` : 'No VeggieBooks yet'}
          />
          <StatCard
            index={2}
            icon="question"
            label="Questions"
            value={data.questions.length}
            chip={`${summary.choices} choices`}
            chipUp
            note="Shown in the app"
          />
          <StatCard
            index={3}
            icon="chart"
            label="Most picked answer"
            value={summary.top?.count ?? 0}
            chip={summary.top ? `${summary.top.percent}%` : undefined}
            chipUp
            note={summary.top ? summary.top.label : 'No answers yet'}
          />
        </div>
      )}

      <QaFiltersBar
        data={data}
        study={study}
        onStudy={(s) => {
          setStudy(s)
          setFilters(noQaFilters)
        }}
        books={books.length}
        value={filters}
        onChange={setFilters}
      />

      <div className="qa-tabs" role="tablist" aria-label="Question Analytics views">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'is-on' : undefined} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {!data && !error && <p className="muted">Loading...</p>}

      {data && books.length === 0 && (
        <p className="st-muted qa-empty">
          {data.books.length === 0 ? 'No books saved with tracking on yet.' : 'No books match these filters.'}
        </p>
      )}

      {data && books.length > 0 && (
        <div key={tab} className="qa-body">
          {tab === 'questions' && <QuestionsTab data={data} veggie={veggie} />}
          {tab === 'picks' && <PicksTab data={data} books={books} />}
          {tab === 'compare' && <CompareTab data={data} veggie={veggie} />}
          {tab === 'statistics' && <StatisticsTab books={books} />}
        </div>
      )}
    </div>
  )
}