import { ACCOUNT } from '../../i18n/strings/account'
import { useStrings } from '../../i18n/useStrings'
import { TrashIcon } from '../icons/AccountIcons'

// Shown to admin accounts in place of Delete account. The API refuses the
// delete for admins (api/Auth/AccountController.cs); this explains why.

export function AdminDeleteNote() {
  const t = useStrings(ACCOUNT)

  return (
    <div className="account-card">
      <div className="account-card-head">
        <span className="account-card-icon is-danger">
          <TrashIcon />
        </span>
        <div className="account-card-head-text">
          <h2 className="account-card-title">{t.delTitle}</h2>
          <p className="account-card-text">{t.delAdminNote}</p>
        </div>
      </div>
    </div>
  )
}