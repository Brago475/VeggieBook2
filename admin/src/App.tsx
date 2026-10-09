import { lazy, Suspense, useState } from 'react'
import { ComingSoon } from './components/common/ComingSoon'
import { AdminShell } from './components/layout/AdminShell'
import type { AdminTab } from './components/layout/navigation'
import { useSession } from './hooks/useSession'
import { Accounts } from './pages/Accounts'
import { Overview } from './pages/Overview'
import { Research } from './pages/Research'
import { SignIn } from './pages/SignIn'

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
// While the redesign is in progress, three sections show an older screen:
// All Data shows Research, Question Analytics shows Analytics, and Settings
// shows Accounts. Each gets its new page in a later step.
//
// Analytics is loaded only when it is opened. It carries the chart library,
// which is most of the site's size, so the other screens don't wait for it.

const Analytics = lazy(() =>
  import('./pages/Analytics').then((m) => ({ default: m.Analytics })),
)

const upcoming: Partial<Record<AdminTab, { title: string; text: string }>> = {
  participants: {
    title: 'Participants',
    text: 'Everyone by research ID: age range, books, last active, and whether tracking is on. This is where you choose people for a study.',
  },
  studies: {
    title: 'Studies',
    text: 'Start or stop a study, choose its accounts, send the in-app notice, and see who has seen it.',
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

  if (session.status === 'loading') {
    return <p className="admin-loading">Loading...</p>
  }

  if (session.status === 'signedOut') {
    return <SignIn onSignIn={signIn} />
  }

  const soon = upcoming[tab]

  return (
    <AdminShell
      email={session.email}
      isRoot={session.isRoot}
      tab={tab}
      onTab={setTab}
      onSignOut={signOut}
    >
      {tab === 'overview' && <Overview onOpen={setTab} />}
      {tab === 'data' && <Research />}
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