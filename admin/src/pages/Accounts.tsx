import { useState } from 'react'
import { AccountDetail } from '../components/accounts/AccountDetail'
import { AccountSearch } from '../components/accounts/AccountSearch'
import '../styles/accounts.css'

// The Accounts tab: search, then open one account.
//
// The search stays mounted (only hidden) while an account is open, so going
// back keeps the search text and results. Coming back also refreshes the
// results, since an action on the account may have changed them.

type Props = {
  currentEmail: string
}

export function Accounts({ currentEmail }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  function back() {
    setOpenId(null)
    setRefreshKey((k) => k + 1)
  }

  return (
    <>
      <div hidden={openId !== null}>
        <AccountSearch onOpen={setOpenId} refreshKey={refreshKey} />
      </div>
      {openId && <AccountDetail id={openId} currentEmail={currentEmail} onBack={back} />}
    </>
  )
}