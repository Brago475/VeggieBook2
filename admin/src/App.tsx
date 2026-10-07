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
// Analytics is loaded only when it is opened. It carries the chart library,
// which is most of the site's size, so the other screens don't wait for it.

const Analytics = lazy(() =>
  import('./pages/Analytics').then((m) => ({ default: m.Analytics })),
)

const upcoming: Partial<Record<AdminTab, { title: string; text: string }>> = {
  reports: {
    title: 'Reports',
    text: 'Ready-made reports for a study: frequencies, percentages, means, medians, standard deviations, and cross-tabs, per person and in total.',
  },
  system: {
    title: 'System',
    text: 'Server and database health, and a log of admin actions such as unlocks and role changes.',
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
      {tab === 'overview' && <Overview />}
      {tab === 'analytics' && (
        <Suspense fallback={<p className="muted">Loading...</p>}>
          <Analytics />
        </Suspense>
      )}
      {tab === 'accounts' && <Accounts currentEmail={session.email} />}
      {tab === 'research' && <Research />}
      {soon && <ComingSoon title={soon.title} text={soon.text} />}
    </AdminShell>
  )
}