import { useEffect, useState } from 'react'
import { ComingSoon } from './components/common/ComingSoon'
import { PageSkeleton } from './components/common/PageSkeleton'
import { AdminShell } from './components/layout/AdminShell'
import { navItems, type AdminTab } from './components/layout/navigation'
import { useSession } from './hooks/useSession'
import { Accounts } from './pages/Accounts'
import { Activity } from './pages/Activity'
import { AllData } from './pages/AllData'
import { Books } from './pages/Books'
import { Overview } from './pages/Overview'
import { Participants } from './pages/Participants'
import { QuestionAnalytics } from './pages/QuestionAnalytics'
import { SignIn } from './pages/SignIn'
import { Studies } from './pages/Studies'
import './styles/motion.css'

// Admin site root (admin.veggiebook2.com). Access requires Cloudflare Access
// and the API's Admin role. The open page is kept in the URL hash (#books),
// so a refresh reopens it and Back/Forward move between pages. Unbuilt
// sections show ComingSoon. dataStudy and dataSearch preselect a study or
// research ID when another page opens All Data.

const upcoming: Partial<Record<AdminTab, { title: string; text: string }>> = {
  content: {
    title: 'Content',
    text: 'The recipes and secrets, read-only, opening the same way they do in the app.',
  },
  export: {
    title: 'Export',
    text: 'Download everything at once for SPSS, Excel, CSV, or R, with a codebook, linked by research ID.',
  },
}

function tabFromHash(): AdminTab {
  const id = window.location.hash.slice(1)
  return navItems.some((i) => i.id === id) ? (id as AdminTab) : 'overview'
}

export function App() {
  const { session, signIn, signOut } = useSession()
  const [tab, setTab] = useState<AdminTab>(tabFromHash)
  const [dataStudy, setDataStudy] = useState<number | null>(null)
  const [dataSearch, setDataSearch] = useState('')

  // Back and Forward, or a hash typed into the address bar.
  useEffect(() => {
    const onPop = () => setTab(tabFromHash())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (session.status === 'loading') {
    return <PageSkeleton fullScreen label="Loading VeggieBook admin" />
  }

  if (session.status === 'signedOut') {
    return <SignIn onSignIn={signIn} />
  }

  const soon = upcoming[tab]

  function go(next: AdminTab) {
    if (window.location.hash !== `#${next}`) window.history.pushState(null, '', `#${next}`)
    setTab(next)
  }

  // Regular navigation clears any preselected study or search.
  function openTab(next: AdminTab) {
    setDataStudy(null)
    setDataSearch('')
    go(next)
  }

  function openStudyData(study: number) {
    setDataStudy(study)
    setDataSearch('')
    go('data')
  }

  function openPersonData(researchId: string) {
    setDataStudy(null)
    setDataSearch(researchId)
    go('data')
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
      {tab === 'activity' && <Activity />}
      {tab === 'settings' && <Accounts currentEmail={session.email} />}
      {soon && <ComingSoon title={soon.title} text={soon.text} />}
    </AdminShell>
  )
}