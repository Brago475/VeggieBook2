import { useMemo, useState } from 'react'
import { AllDataIcon } from '../components/alldata/AllDataIcons'
import { TopbarActions } from '../components/layout/TopbarSlot'
import type { AdminTab } from '../components/layout/navigation'
import { ParticipantsBanner } from '../components/participants/ParticipantsBanner'
import { PersonCard } from '../components/participants/PersonCard'
import { PersonPanel } from '../components/participants/PersonPanel'
import { StatusTabs, type StatusFilter } from '../components/participants/StatusTabs'
import { ParticipantsSkeleton } from '../components/skeletons/ParticipantsSkeleton'
import { useHashParam } from '../hooks/useHashParam'
import { useHeld } from '../hooks/useHeld'
import { useParticipants } from '../hooks/useParticipants'
import '../styles/studies.css'
import '../styles/participants.css'

// Admin Participants page: research IDs with tracking status, filters, and
// the per-person panel. The status tab is kept in the address. Admin and
// guest accounts never appear. Turning tracking off, from a card's switch or
// the panel, always goes through the panel's confirm.

const FILTERS: readonly StatusFilter[] = ['all', 'on', 'off_self', 'off_admin']

type Props = {
  onOpen: (tab: AdminTab) => void
  // Opens All Data searched to this research ID.
  onOpenPersonData: (researchId: string) => void
}

export function Participants({ onOpen, onOpenPersonData }: Props) {
  const { data, error, loading, reload, setTracking } = useParticipants()
  const [filter, setFilter] = useHashParam('status', FILTERS)
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [panelClosed, setPanelClosed] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [switchError, setSwitchError] = useState<string | null>(null)
  // Outline stays up briefly even on a fast load.
  const firstLoad = useHeld(!data && !error)

  const shown = useMemo(() => {
    const needle = search.trim().toUpperCase()
    return (data?.people ?? []).filter(
      (p) => (filter === 'all' || p.status === filter) && (!needle || p.researchId.includes(needle)),
    )
  }, [data, filter, search])

  if (!data && error) {
    return (
      <p className="error" role="alert">
        {error}
      </p>
    )
  }

  if (firstLoad || !data) return <ParticipantsSkeleton />

  // The panel shows the person clicked, or the first card until one is.
  const person = panelClosed
    ? null
    : (picked ? data.people.find((p) => p.researchId === picked) : undefined) ?? shown[0] ?? null

  function pick(researchId: string) {
    setPicked(researchId)
    setPanelClosed(false)
    if (confirmingId !== researchId) setConfirmingId(null)
  }

  // From a card's switch: open that person and ask first.
  function askTurnOff(researchId: string) {
    setPicked(researchId)
    setPanelClosed(false)
    setConfirmingId(researchId)
  }

  async function turnOn(researchId: string) {
    setSwitchError(null)
    const message = await setTracking(researchId, true)
    if (message) setSwitchError(message)
    return message
  }

  return (
    <div className="pt-page">
      <TopbarActions>
        <button type="button" className="st-button" onClick={() => void reload()}>
          <AllDataIcon name="refresh" size={17} className={loading ? 'pt-spin is-spinning' : 'pt-spin'} />
          {loading ? 'Updating...' : 'Refresh'}
        </button>
      </TopbarActions>

      {(error || switchError) && (
        <p className="error" role="alert">
          {error ?? switchError}
        </p>
      )}

      <ParticipantsBanner data={data} onOpenStudies={() => onOpen('studies')}>
        <StatusTabs counts={data.counts} value={filter} onChange={setFilter} />
        <label className="pt-search">
          <AllDataIcon name="search" size={16} />
          <input
            type="search"
            placeholder="Search by research ID..."
            aria-label="Search by research ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </ParticipantsBanner>

      <div className={person ? 'pt-split has-panel' : 'pt-split'}>
        {shown.length === 0 ? (
          <p className="st-muted pt-empty">
            {data.people.length === 0 ? 'No participants yet.' : 'No one matches.'}
          </p>
        ) : (
          <div className="pt-cards">
            {shown.map((p) => (
              <PersonCard
                key={p.researchId}
                person={p}
                selected={p.researchId === person?.researchId}
                onSelect={() => pick(p.researchId)}
                onTurnOff={() => askTurnOff(p.researchId)}
                onTurnOn={() => turnOn(p.researchId)}
              />
            ))}
          </div>
        )}

        {person && (
          <PersonPanel
            key={person.researchId}
            person={person}
            study={data.study}
            confirming={confirmingId === person.researchId}
            onConfirmingChange={(on) => setConfirmingId(on ? person.researchId : null)}
            onSetTracking={(on) => setTracking(person.researchId, on)}
            onOpenData={() => onOpenPersonData(person.researchId)}
            onClose={() => {
              setPanelClosed(true)
              setConfirmingId(null)
            }}
          />
        )}
      </div>
    </div>
  )
}