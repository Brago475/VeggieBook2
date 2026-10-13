import { useState } from 'react'
import { CustomZip } from '../components/export/CustomZip'
import { ExportAside } from '../components/export/ExportAside'
import { ExportHero } from '../components/export/ExportHero'
import { SingleFiles } from '../components/export/SingleFiles'
import { SpecificData } from '../components/export/SpecificData'
import { StudyDownloads } from '../components/export/StudyDownloads'
import { TopbarActions } from '../components/layout/TopbarSlot'
import { studyTitle } from '../components/studies/studyFormat'
import { useContentLibrary } from '../hooks/useContentLibrary'
import { useExportSummary } from '../hooks/useExportSummary'
import { useParticipants } from '../hooks/useParticipants'
import { useRecentDownloads } from '../hooks/useRecentDownloads'
import { useStudies } from '../hooks/useStudies'
import '../styles/studies.css'
import '../styles/export.css'

// Admin Export page: every research download in one place. The scope (all
// data or one study) and the answers option chosen in the hero apply to
// every section. Built on api/Admin/AdminExportController.cs and the All
// Data export routes.

export function Export() {
  const { data: studyData } = useStudies()
  const library = useContentLibrary()
  const participants = useParticipants()
  const recent = useRecentDownloads()
  const [study, setStudy] = useState<number | null>(null)
  const [answers, setAnswers] = useState(false)
  const { summary } = useExportSummary({ study })

  const studies = studyData?.studies ?? []
  const picked = study === null ? null : studies.find((s) => s.number === study) ?? null
  const scopeName = picked ? studyTitle(picked) : 'All data'

  return (
    <>
      <TopbarActions>
        <span className="ct-readonly">Research IDs only, no names or emails</span>
      </TopbarActions>

      <div className="ex-layout">
        <div className="ex-main">
          <ExportHero
            studies={studies}
            study={study}
            onStudy={setStudy}
            answers={answers}
            onAnswers={setAnswers}
            summary={summary}
            onDownload={recent.remember}
          />
          <StudyDownloads studies={studies} answers={answers} onDownload={recent.remember} />
          <SingleFiles study={study} answers={answers} scopeName={scopeName} onDownload={recent.remember} />
          <SpecificData
            study={study}
            answers={answers}
            library={library.data}
            people={participants.data?.people ?? []}
            onDownload={recent.remember}
          />
          <CustomZip study={study} answers={answers} onDownload={recent.remember} />
        </div>

        <ExportAside recent={recent.items} />
      </div>
    </>
  )
}