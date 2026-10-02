import { LegalContact, type LegalDocument } from '../components/LegalPage'

// The Privacy Policy. To change the text: edit it here, change version and
// updated, and everyone is asked to agree to the new version.

export const PRIVACY: LegalDocument = {
  title: 'Privacy Policy',
  version: '1.1',
  updated: 'October 2, 2026',
  intro: (
    <p>
      This policy explains what information VeggieBook2 collects and how it is
      used.{' '}
      <strong>By creating an account, you agree to this Privacy Policy</strong>{' '}
      and to our Terms of Use.
    </p>
  ),
  sections: [
    {
      id: 'information-we-collect',
      heading: 'Information We Collect',
      body: (
        <>
          <p>When you create an account, we collect only what the account requires:</p>
          <ul className="legal-list">
            <li>First and last name</li>
            <li>Username</li>
            <li>Email address</li>
            <li>Age range (not your date of birth)</li>
            <li>Your recovery PIN and security question and answer</li>
            <li>The books you create</li>
          </ul>
          <p>
            Your password, recovery PIN, and security answer are never stored in
            readable form. We keep only a secure one-way hash of each, which
            cannot be converted back into what you typed.
          </p>
        </>
      ),
    },
    {
      id: 'information-you-share',
      heading: 'Information You Choose to Share',
      body: (
        <p>
          Please do not include sensitive information, such as health details,
          identification numbers, or your home address, in your username, your
          security answer, or your cover photos.
        </p>
      ),
    },
    {
      id: 'privacy-of-your-books',
      heading: 'Privacy of Your Books',
      body: (
        <p>
          Your books and cover photos remain in your account. The application
          provides no way for anyone else to view them.
        </p>
      ),
    },
    {
      id: 'guest-visits',
      heading: 'Guest Visits',
      body: (
        <p>
          Guest visits require no name or email address. All guest data is
          deleted when the visit ends, or after 24 hours.
        </p>
      ),
    },
    {
      id: 'how-we-use-it',
      heading: 'How We Use Your Information',
      body: (
        <p>
          We use your information only to operate your account: to sign you in,
          store your books, and help you recover your account. VeggieBook2 does
          not send email at this time. We do not sell your information, display
          advertising, or send marketing messages.
        </p>
      ),
    },
    {
      id: 'research-studies',
      heading: 'Research Studies',
      body: (
        <>
          <p>Only individuals invited by the research team take part in a study. If you are invited:</p>
          <ul className="legal-list">
            <li>
              Study tracking is <strong>on</strong> for your account from the
              start. You are told this before you create your account.
            </li>
            <li>
              While study tracking is on, the choices you make in the
              application, such as the answers and vegetables you select, are
              recorded for the study.
            </li>
            <li>
              Study data is recorded under your <strong>Study ID</strong>, which
              is separate from your account and does not contain your name or
              email address.
            </li>
            <li>
              Your Study ID is displayed in Account settings while study tracking
              is on.
            </li>
            <li>
              You may turn study tracking off at any time in Account settings.
              Recording stops, and your Study ID is no longer displayed.
            </li>
            <li>
              The research team may ask you for your Study ID. If you provide it,
              the research team will be able to identify which study data is
              yours.
            </li>
          </ul>
          <p>
            All other users, including guests, are never tracked and never see
            the study option.
          </p>
        </>
      ),
    },
    {
      id: 'cookies',
      heading: 'Cookies',
      body: (
        <p>
          VeggieBook2 uses a single cookie to keep you signed in. It does not use
          advertising or third-party tracking cookies.
        </p>
      ),
    },
    {
      id: 'account-deletion',
      heading: 'Account Deletion',
      body: (
        <p>
          You may delete your account at any time from Account settings. Your
          account and books are deleted immediately and{' '}
          <strong>cannot be recovered.</strong> If you took part in a study, data
          already recorded under your Study ID may be retained for research
          purposes.
        </p>
      ),
    },
    {
      id: 'contact',
      heading: 'Contact',
      body: <LegalContact />,
    },
    {
      id: 'changes',
      heading: 'Changes to This Policy',
      body: (
        <p>
          If this policy is updated, the version number will change, and you will
          be asked to review and accept the new version.
        </p>
      ),
    },
  ],
}