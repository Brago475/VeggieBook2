import { lazy, Suspense, useState } from 'react'
import { ComingSoon } from './components/common/ComingSoon'
import { AdminShell } from './components/layout/AdminShell'
import type { AdminTab } from './components/layout/navigation'
import { useSession } from './hooks/useSession'
import { Accounts } from './pages/Accounts'
import { AllData } from './pages/AllData'
import { Overview } from './pages/Overview'
import { SignIn } from './pages/SignIn'
import { Studies } from './pages/Studies'

// The admin site for VeggieBook2, served at admin.veggiebook2.com.
//
// Two locks keep it private: Cloudflare Access lets only listed emails load
// the site, and the API refuses every /api/admin/ request from an account
// without the Admin role. The sign-in screen here is the second lock's
// front door; it is not the security on its own.
//
// Screens are switched with a tab in state rather than a router. Sections
// that are not built yet describe what is coming (see
// components/layout/navigation.ts for which ones are ready).
//
// While the redesign is in progress, two sections show an older screen:
// Question Analytics shows Analytics, and Settings shows Accounts. Each gets
// its new page in a later step. The old Research page (pages/Research.tsx)
// is no longer opened from the menu; All Data replaces it.
//
// "Open in All Data" on the Studies page opens All Data with that study
// picked (dataStudy). Opening All Data from the sidebar starts on All time.
//
// Analytics is loaded only when it is opened. It carries the chart library,
// which is most of the site's size, so the other screens don't wait for it.

const Analytics = lazy(() =>
  import('./pages/Analytics').then((m) => ({ default: m.Analytics })),
)

const upcoming: Partial<Record<AdminTab, { title: string; text: string }>> = {
  participants: {
    title: 'Participants',
    text: 'Everyone by research ID: whether tracking is on, who turned it off, and whether they saw the study notice. This is where you turn someone out of a study.',
  },
  books: {
    title: 'Books',
    text: 'Every saved book and what happened to it: saved, edited later, left early, or deleted.',
  },
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

  if (session.status === 'loading') {
    return <p className="admin-loading">Loading...</p>
  }

  if (session.status === 'signedOut') {
    return <SignIn onSignIn={signIn} />
  }

  const soon = upcoming[tab]

  // Any normal way of changing page (sidebar, Overview links) forgets the
  // study handed over by the Studies page.
  function openTab(next: AdminTab) {
    setDataStudy(null)
    setTab(next)
  }

  function openStudyData(study: number) {
    setDataStudy(study)
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
      {tab === 'studies' && <Studies onOpen={openTab} onOpenStudyData={openStudyData} />}
      {tab === 'data' && <AllData key={dataStudy ?? 'all'} initialStudy={dataStudy} />}
      {tab === 'questions' && (
        <Suspense fallback={<p className="muted">Loading...</p>}>
          <Analytics />
        </Suspense>
      )}
      {tab === 'settings' && <Accounts currentEmail={session.email} />}
      {soon && <ComingSoon title={soon.title} text={soon.text} />}
    </AdminShell>
  )
}