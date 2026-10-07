import { useState } from 'react'
import { ComingSoon } from './components/common/ComingSoon'
import { AdminShell, type AdminTab } from './components/layout/AdminShell'
import { useSession } from './hooks/useSession'
import { Overview } from './pages/Overview'
import { SignIn } from './pages/SignIn'

// The admin site for VeggieBook2, served at admin.veggiebook2.com.
//
// Two locks keep it private: Cloudflare Access lets only listed emails load
// the site, and the API refuses every /api/admin/ request from an account
// without the Admin role. The sign-in screen here is the second lock's
// front door; it is not the security on its own.
//
// Screens are switched with a tab in state rather than a router. The admin
// site is a handful of screens, so a router would add a dependency for
// nothing.

export function App() {
  const { session, signIn, signOut } = useSession()
  const [tab, setTab] = useState<AdminTab>('overview')

  if (session.status === 'loading') {
    return <p className="admin-loading">Loading...</p>
  }

  if (session.status === 'signedOut') {
    return <SignIn onSignIn={signIn} />
  }

  return (
    <AdminShell email={session.email} tab={tab} onTab={setTab} onSignOut={signOut}>
      {tab === 'overview' && <Overview />}
      {tab === 'accounts' && (
        <ComingSoon title="Accounts" text="Account search, details, and unlock are next." />
      )}
      {tab === 'studies' && (
        <ComingSoon
          title="Studies"
          text="Studies start once the IRB is approved. Tracking stays off until then."
        />
      )}
      {tab === 'reports' && (
        <ComingSoon
          title="Reports"
          text="Study reports (percentages, means, medians, and CSV export) come with Studies."
        />
      )}
    </AdminShell>
  )
}