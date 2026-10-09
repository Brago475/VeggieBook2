import { useEffect, useState } from 'react'
import { ResearchFilters } from '../components/research/ResearchFilters'
import { DataTab } from '../components/research/tabs/DataTab'
import { MostChosenTab } from '../components/research/tabs/MostChosenTab'
import { QuestionsTab } from '../components/research/tabs/QuestionsTab'
import { StudiesTab } from '../components/research/tabs/StudiesTab'
import { VariablesTab } from '../components/research/tabs/VariablesTab'
import { Tabs } from '../components/common/Tabs'
import { StatIcon } from '../components/icons/StatIcons'
import type { ResearchFilters as Filters, ResearchOptions, SheetName } from '../types/research'
import { api } from '../utils/api'
import { noFilters } from '../utils/researchQuery'
import '../styles/research.css'

// The Research page: the anonymous research sheets, keyed by research ID.
// No email or name appears anywhere on this page.
//
// The chosen sheet and the filters live here, so they carry across the
// Data, Variables, Questions, and Most chosen tabs. Refresh loads every
// sheet again.

type ResearchTab = 'data' | 'variables' | 'questions' | 'chosen' | 'studies'

const tabs: { id: ResearchTab; label: string }[] = [
  { id: 'data', label: 'Data' },
  { id: 'variables', label: 'Variables' },
  { id: 'questions', label: 'Questions' },
  { id: 'chosen', label: 'Most chosen' },
  { id: 'studies', label: 'Studies' },
]

// Which sheet the filter bar describes on each tab that shows it.
function filterSheet(tab: ResearchTab, sheetName: SheetName): SheetName {
  if (tab === 'questions') return 'responses'
  if (tab === 'chosen') return 'choices'
  return sheetName
}

export function Research() {
  const [tab, setTab] = useState<ResearchTab>('data')
  const [sheetName, setSheetName] = useState<SheetName>('responses')
  const [filters, setFilters] = useState<Filters>(noFilters)
  const [options, setOptions] = useState<ResearchOptions | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    api<ResearchOptions>('/admin/research/options')
      .then((o) => {
        if (!cancelled) setOptions(o)
      })
      .catch(() => {
        // The filters still work without the lists; they just start empty.
      })
    return () => {
      cancelled = true
    }
  }, [version])

  const showFilters = tab === 'data' || tab === 'questions' || tab === 'chosen'

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Research</h1>
        <div className="page-actions">
          <span className="muted small">Anonymous: rows are keyed by research ID.</span>
          <button type="button" className="button-secondary" onClick={() => setVersion((v) => v + 1)}>
            <StatIcon name="refresh" size={16} />
            Refresh
          </button>
        </div>
      </div>

      <Tabs tabs={tabs} value={tab} onChange={setTab} label="Research views" />

      <div className="tab-content">
        {showFilters && (
          <ResearchFilters
            sheet={filterSheet(tab, sheetName)}
            filters={filters}
            options={options}
            onChange={setFilters}
          />
        )}

        {tab === 'data' && (
          <DataTab
            sheetName={sheetName}
            onSheetName={setSheetName}
            filters={filters}
            version={version}
          />
        )}
        {tab === 'variables' && <VariablesTab sheetName={sheetName} filters={filters} version={version} />}
        {tab === 'questions' && <QuestionsTab filters={filters} version={version} />}
        {tab === 'chosen' && <MostChosenTab filters={filters} version={version} />}
        {tab === 'studies' && <StudiesTab />}
      </div>
    </>
  )
}