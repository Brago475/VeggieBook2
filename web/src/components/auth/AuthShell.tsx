import type { ReactNode } from 'react'
import { AUTH_PHOTO } from '../../utils/authPhoto'
import { coverSrc } from '../../utils/coverSrc'
import { SafeImage } from '../common/SafeImage'
import { BackArrowIcon } from '../icons/StepIcons'

// The frame every account screen shares: the photograph across the top,
// Back riding over it in a white pill, and the logo under it. Sign in,
// create account, forgot password, reset password, and confirm email all
// sit inside this, so they look like one family.
//
// The masthead is hidden on these screens (see App.tsx).

type Props = {
  onBack?: () => void
  children: ReactNode
}

export function AuthShell({ onBack, children }: Props) {
  return (
    <div className="auth-screen">
      <div className="auth-hero">
        {onBack && (
          <button type="button" className="auth-back" onClick={onBack}>
            <BackArrowIcon />
            Back
          </button>
        )}
        <SafeImage src={coverSrc(AUTH_PHOTO)} loading="eager" />
      </div>

      <div className="auth-main">
        <img
          className="auth-logo"
          src="/brand/logo-positive-en.png"
          alt="VeggieBook, Quick Help for Meals"
        />
        {children}
      </div>
    </div>
  )
}