import { useState } from 'react'
import { ComingSoon } from './components/common/ComingSoon'
import { AdminShell } from './components/layout/AdminShell'
import type { AdminTab } from './components/layout/navigation'
import { useSession } from './hooks/useSession'
import { Accounts } from './pages/Accounts'
import { AllData } from './pages/AllData'
import { Books } from './pages/Books'
import { Overview } from './pages/Overview'
import { Participants } from './pages/Participants'
import { QuestionAnalytics } from './pages/QuestionAnalytics'
import { SignIn } from './pages/SignIn'
import { Studies } from './pages/Studies'
import './styles/motion.css'

// Admin site root (admin.veggiebook2.com). Access requires Cloudflare Access
// and the API's Admin role. Pages switch by tab state; unbuilt sections show
// ComingSoon. dataStudy and dataSearch preselect a study or research ID when
// another page opens All Data.

const upcoming: Partial<Record<AdminTab, { title: string; text: string }>> = {
  activity: {
    title: 'Activity',
    text: 'When people use the app, how they move through a book, where they leave, and which devices they use.',
  },
  content: {
    title: 'Content',
    text: 'The recipes and secrets, read-only, opening the same way they do in the app.',
  },
  export: {
    title: 'Export',
    text: 'Download everything at once for SPSS, Excel, CSV, or R, with a codebook, linked by research ID.',
  },
}

export function App() {
  const { session, signIn, signOut } = useSession()
  const [tab, setTab] = useState<AdminTab>('overview')
  const [dataStudy, setDataStudy] = useState<number | null>(null)
  const [dataSearch, setDataSearch] = useState('')

  if (session.status === 'loading') {
    return <p className="admin-loading">Loading...</p>
  }

  if (session.status === 'signedOut') {
    return <SignIn onSignIn={signIn} />
  }

  const soon = upcoming[tab]

  // Regular navigation clears any preselected study or search.
  function openTab(next: AdminTab) {
    setDataStudy(null)
    setDataSearch('')
    setTab(next)
  }

  function openStudyData(study: number) {
    setDataStudy(study)
    setDataSearch('')
    setTab('data')
  }

  function openPersonData(researchId: string) {
    setDataStudy(null)
    setDataSearch(researchId)
    setTab('data')
  }

  return (
    <AdminShell
      email={session.email}
      isRoot={session.isRoot}
      tab={tab}
      onTab={openTab}
      onSignOut={signOut}
    >
      {tab === 'overview' && <Overview onOpen={openTab} />}
      {tab === 'participants' && <Participants onOpen={openTab} onOpenPersonData={openPersonData} />}
      {tab === 'studies' && <Studies onOpen={openTab} onOpenStudyData={openStudyData} />}
      {tab === 'data' && (
        <AllData key={`${dataStudy ?? 'all'}|${dataSearch}`} initialStudy={dataStudy} initialSearch={dataSearch} />
      )}
      {tab === 'books' && <Books onOpenPersonData={openPersonData} />}
      {tab === 'questions' && <QuestionAnalytics />}
      {tab === 'settings' && <Accounts currentEmail={session.email} />}
      {soon && <ComingSoon title={soon.title} text={soon.text} />}
    </AdminShell>
  )
}