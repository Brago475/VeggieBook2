import { useRef, useState } from 'react'
import { TopbarActions } from '../components/layout/TopbarSlot'
import { RunningStudy } from '../components/studies/RunningStudy'
import { StudyBooks } from '../components/studies/StudyBooks'
import { StudyEmpty } from '../components/studies/StudyEmpty'
import { StudySwitch } from '../components/studies/StudySwitch'
import { StudyTimeline } from '../components/studies/StudyTimeline'
import type { AdminTab } from '../components/layout/navigation'
import { useStudies } from '../hooks/useStudies'
import type { StudySummary } from '../types/studies'
import '../styles/studies.css'
import '../styles/studies-timeline.css'

// The Studies page: one switch to run a study, and every study so far on a
// timeline.
//
//   Top bar    the on/off switch (components/studies/StudySwitch.tsx)
//   Top card   the study running now, or when the last one ended
//   Timeline   every study placed by its dates, and a row for each
//   Data       the books of the picked study (the running one, or the
//              newest, until one is clicked), with downloads
//
// Before any study exists: who Study 1 would include and a big button to
// start it (it opens the switch's confirm step).
//
// A study runs from the moment it is switched on until it is switched off,
// and is numbered on its own (Study 1, Study 2). Only one runs at a time.
// Who is tracked and who sees the notice: api/Research/StudyTracking.cs.

type Props = {
  onOpen: (tab: AdminTab) => void
  // Opens All Data with this study picked. Without it, All Data opens with
  // no study picked.
  onOpenStudyData?: (study: number) => void
}

export function Studies({ onOpen, onOpenStudyData }: Props) {
  const { data, error, switchStudy } = useStudies()
  const [picked, setPicked] = useState<number | null>(null)
  const [openRequest, setOpenRequest] = useState(0)
  const dataRef = useRef<HTMLDivElement>(null)

  if (!data) {
    return error ? (
      <p className="error" role="alert">
        {error}
      </p>
    ) : (
      <p className="muted">Loading...</p>
    )
  }

  const running = data.studies.find((s) => s.running) ?? null
  const selected = data.studies.find((s) => s.id === picked) ?? running ?? data.studies[0] ?? null
  const start = () => setOpenRequest((n) => n + 1)

  function pick(study: StudySummary) {
    setPicked(study.id)
    dataRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
          <RunningStudy running={running} latest={data.studies[0]} nextNumber={data.nextNumber} onStart={start} />
          <StudyTimeline studies={data.studies} selected={selected.id} onSelect={pick} />
          <div ref={dataRef} className="tl-anchor">
            <StudyBooks
              key={selected.id}
              study={selected}
              onOpenData={() => (onOpenStudyData ? onOpenStudyData(selected.number) : onOpen('data'))}
            />
          </div>
        </>
      )}
    </div>
  )
}