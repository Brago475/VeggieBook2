import { useCallback, useRef, useState } from 'react'
import { PageSkeleton } from '../components/common/PageSkeleton'
import { TopbarActions } from '../components/layout/TopbarSlot'
import { DeleteStudyDialog } from '../components/studies/DeleteStudyDialog'
import { RunningStudy } from '../components/studies/RunningStudy'
import { StudyBooks } from '../components/studies/StudyBooks'
import { StudyEmpty } from '../components/studies/StudyEmpty'
import { StudySwitch } from '../components/studies/StudySwitch'
import { StudyTimeline } from '../components/studies/StudyTimeline'
import { StudyToast } from '../components/studies/StudyToast'
import { studyTitle } from '../components/studies/studyFormat'
import type { AdminTab } from '../components/layout/navigation'
import { useStudies } from '../hooks/useStudies'
import type { StudySummary } from '../types/studies'
import '../styles/studies.css'
import '../styles/studies-timeline.css'
import '../styles/studies-edit.css'

// Studies page: on/off switch in the top bar, the running study, a yearly
// timeline with rename and delete, and the selected study's books.
// Only one study runs at a time; only ended studies can be deleted.
// Tracking scope: api/Research/StudyTracking.cs.

type Props = {
  onOpen: (tab: AdminTab) => void
  /** Opens All Data filtered to the given study. */
  onOpenStudyData?: (study: number) => void
}

export function Studies({ onOpen, onOpenStudyData }: Props) {
  const { data, error, switchStudy, renameStudy, deleteStudy } = useStudies()
  const [picked, setPicked] = useState<number | null>(null)
  const [openRequest, setOpenRequest] = useState(0)
  const [deleting, setDeleting] = useState<StudySummary | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const dataRef = useRef<HTMLDivElement>(null)
  const closeToast = useCallback(() => setToast(null), [])

  if (!data) {
    return error ? (
      <p className="error" role="alert">
        {error}
      </p>
    ) : (
      <PageSkeleton cards={0} label="Loading studies" />
    )
  }

  const running = data.studies.find((s) => s.running) ?? null
  const selected = data.studies.find((s) => s.id === picked) ?? running ?? data.studies[0] ?? null
  const start = () => setOpenRequest((n) => n + 1)

  function pick(study: StudySummary) {
    setPicked(study.id)
    dataRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function rename(study: StudySummary, name: string) {
    const message = await renameStudy(study.id, name)
    if (!message) {
      setToast(
        name
          ? `Renamed ${studyTitle(study)} to ${name}.`
          : `${studyTitle(study)} is called Study ${study.number} again.`,
      )
    }
    return message
  }

  async function remove(study: StudySummary, confirm: string) {
    const message = await deleteStudy(study.id, confirm)
    if (!message) setToast(`Deleted ${studyTitle(study)}. Its books are still in All Data.`)
    return message
  }

  return (
    <div className="st-page">
      <TopbarActions>
        <StudySwitch data={data} onSwitch={switchStudy} openRequest={openRequest} />
      </TopbarActions>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {data.studies.length === 0 || !selected ? (
        <div className="st-layout">
          <StudyEmpty nextNumber={data.nextNumber} preview={data.preview} onStart={start} />
        </div>
      ) : (
        <>
          <RunningStudy
            running={running}
            latest={data.studies[0]}
            nextNumber={data.nextNumber}
            onStart={start}
            onRename={rename}
          />
          <StudyTimeline
            studies={data.studies}
            selected={selected.id}
            onSelect={pick}
            onRename={rename}
            onDelete={setDeleting}
          />
          <div ref={dataRef} className="tl-anchor">
            <StudyBooks
              key={selected.id}
              study={selected}
              onOpenData={() => (onOpenStudyData ? onOpenStudyData(selected.number) : onOpen('data'))}
            />
          </div>
        </>
      )}

      {deleting && (
        <DeleteStudyDialog
          study={deleting}
          onDelete={(confirm) => remove(deleting, confirm)}
          onClose={() => setDeleting(null)}
        />
      )}

      {toast && <StudyToast message={toast} onClose={closeToast} />}
    </div>
  )
}