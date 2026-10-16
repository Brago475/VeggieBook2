import { useEffect, useState } from 'react'
import { ComingSoon } from './components/common/ComingSoon'
import { AdminShell } from './components/layout/AdminShell'
import { LoadingScreen } from './components/layout/LoadingScreen'
import { navItems, type AdminTab } from './components/layout/navigation'
import { useSession } from './hooks/useSession'
import { useSplash } from './hooks/useSplash'
import { Activity } from './pages/Activity'
import { AllData } from './pages/AllData'
import { Books } from './pages/Books'
import { Content } from './pages/Content'
import { Export } from './pages/Export'
import { Overview } from './pages/Overview'
import { Participants } from './pages/Participants'
import { QuestionAnalytics } from './pages/QuestionAnalytics'
import { Settings } from './pages/Settings'
import { SignIn } from './pages/SignIn'
import { Studies } from './pages/Studies'
import './styles/motion.css'

// Admin site root (admin.veggiebook2.com). Access requires Cloudflare Access
// and the API's Admin role. The open page is kept in the URL hash (#books),
// so a refresh reopens it and Back/Forward move between pages. Sections
// listed in `upcoming` show ComingSoon. dataStudy and dataSearch preselect a
// study or research ID when another page opens All Data.

const upcoming: Partial<Record<AdminTab, { title: string; text: string }>> = {}

function tabFromHash(): AdminTab {
  const id = window.location.hash.slice(1)
  return navItems.some((i) => i.id === id) ? (id as AdminTab) : 'overview'
}

export function App() {
  const { session, signIn, signOut } = useSession()
  const [tab, setTab] = useState<AdminTab>(tabFromHash)
  const [dataStudy, setDataStudy] = useState<number | null>(null)
  const [dataSearch, setDataSearch] = useState('')
  // First-load screen, held until its bar fills, then faded out.
  const splash = useSplash(session.status !== 'loading')

  // Back and Forward, or a hash typed into the address bar.
  useEffect(() => {
    const onPop = () => setTab(tabFromHash())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

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

  // The page renders under the loading screen once the session is known,
  // so the fade reveals it with no white flash.
  return (
    <>
      {session.status === 'signedOut' && <SignIn onSignIn={signIn} />}

      {session.status === 'admin' && (
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
          {tab === 'content' && <Content />}
          {tab === 'export' && <Export />}
          {tab === 'settings' && <Settings email={session.email} isRoot={session.isRoot} onSignOut={signOut} />}
          {soon && <ComingSoon title={soon.title} text={soon.text} />}
        </AdminShell>
      )}

      {splash !== 'gone' && <LoadingScreen leaving={splash === 'leaving'} />}
    </>
  )
}