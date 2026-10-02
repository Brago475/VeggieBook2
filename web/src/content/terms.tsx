import { LegalContact, type LegalDocument } from '../components/LegalPage'

// The Terms of Use. To change the text: edit it here, change version and
// updated, and everyone is asked to agree to the new version.
//
// Keep version equal to TermsVersion in api/Auth/SignUpRules.cs, which is
// what the API records when someone creates an account.

export const TERMS: LegalDocument = {
  title: 'Terms of Use',
  version: '1.1',
  updated: 'October 2, 2026',
  intro: (
    <p>
      <strong>
        By creating an account, or by using VeggieBook2 as a guest, you agree to
        these Terms of Use and to our Privacy Policy.
      </strong>{' '}
      If you do not agree, please do not use VeggieBook2.
    </p>
  ),
  sections: [
    {
      id: 'about',
      heading: 'About VeggieBook2',
      body: (
        <p>
          VeggieBook2 is a free recipe book application developed at Kean
          University by the Department of Biological Sciences, under the
          direction of Dr. Kim Spaccarotella. It is a new version of the original
          VeggieBook application, created by Dr. Susan H. Evans and Dr. Peter
          Clarke at the University of Southern California. VeggieBook2 helps you
          build personal recipe books from the vegetables you have on hand.
        </p>
      ),
    },
    {
      id: 'free-to-use',
      heading: 'Free to Use',
      body: <p>VeggieBook2 is free. You may use it with an account or as a guest.</p>,
    },
    {
      id: 'eligibility',
      heading: 'Eligibility',
      body: <p>You must be 18 years of age or older to create an account.</p>,
    },
    {
      id: 'your-account',
      heading: 'Your Account',
      body: (
        <>
          <p>
            You are responsible for your account. Keep your password, recovery PIN,
            and security answer to yourself, and do not share your account with
            anyone. VeggieBook2 is not responsible for anything that happens
            through your account, including loss of access or loss of saved books.
          </p>
          <p>
            If you forget your password, you can reset it with your recovery PIN or
            your security question. If you forget all three, we may not be able to
            restore your account. You can contact the VeggieBook2 team, but we
            cannot promise to recover it.
          </p>
          <p>
            You may delete your account at any time from Account settings.{' '}
            <strong>Deleted accounts cannot be recovered</strong>, and all books in
            the account are deleted with it.
          </p>
        </>
      ),
    },
    {
      id: 'privacy-of-your-books',
      heading: 'Privacy of Your Books',
      body: (
        <p>
          Your books and cover photos belong to your account. The application
          provides no way for anyone else to view them.
        </p>
      ),
    },
    {
      id: 'guest-visits',
      heading: 'Guest Visits',
      body: (
        <p>
          Books made during a guest visit are kept until the visit ends, or for up
          to 24 hours. After that, they are permanently deleted and cannot be
          recovered.
        </p>
      ),
    },
    {
      id: 'fair-use',
      heading: 'Fair Use',
      body: (
        <p>
          You agree not to attempt to disrupt the service, or to access any part
          of it that you are not authorized to use.
        </p>
      ),
    },
    {
      id: 'health-information',
      heading: 'Health Information',
      body: (
        <p>
          Recipes and tips in VeggieBook2 are provided for general educational
          purposes only and are not medical advice. If you have food allergies, a
          medical condition, or dietary restrictions, review all ingredients
          carefully and consult a physician or registered dietitian when in
          doubt.
        </p>
      ),
    },
    {
      id: 'research-studies',
      heading: 'Research Studies',
      body: (
        <p>
          VeggieBook2 is part of a research project, and studies may be conducted
          from time to time. Only individuals invited by the research team take
          part. Participants are told that study tracking is turned on for their
          account. If you have not been invited, you are not part of a study, and
          no study data is collected from your use of the application.
        </p>
      ),
    },
    {
      id: 'disclaimer',
      heading: 'Disclaimer',
      body: (
        <p>
          VeggieBook2 is provided "as is." We make reasonable efforts to keep the
          service available and accurate, but features may change, and the
          service may occasionally be unavailable.
        </p>
      ),
    },
    {
      id: 'credits',
      heading: 'Credits',
      body: (
        <p>
          Recipes and content are from the original VeggieBook project by Dr.
          Susan H. Evans and Dr. Peter Clarke, University of Southern California,
          and are shared under the Creative Commons Attribution-ShareAlike 4.0
          International License. Full credits are available on the About page.
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
      heading: 'Changes to These Terms',
      body: (
        <p>
          If these terms are updated, the version number will change, and you
          will be asked to review and accept the new version.
        </p>
      ),
    },
  ],
}