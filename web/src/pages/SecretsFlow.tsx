import { NavBar } from '../components/NavBar'
import { RecipeSkeleton } from '../components/RecipeSkeleton'
import { ScreenLabel } from '../components/ScreenLabel'
import type { SecretsFlowState } from '../hooks/useSecretsFlow'
import type { SecretCategory } from '../types'
import { SecretCategoryPicker } from './SecretCategoryPicker'
import { SecretCoverChooser } from './SecretCoverChooser'
import { SecretExtraCopies } from './SecretExtraCopies'
import { SecretReview } from './SecretReview'
import { SecretTransition } from './SecretTransition'
import { WhoSaysSo } from './WhoSaysSo'

// Shows the current step of making a Secrets Book. The steps and everything
// chosen along the way live in hooks/useSecretsFlow.ts; this only picks the
// screen, the same split as BookFlow and useBookFlow.
//
// The categories are loaded once by App and passed in, since the home
// screen uses them too, to name and picture saved Secrets Books.
//
// Every bottom button is NavBar, the same bar Phase 1 uses, so both kinds
// of book have one button layout.
//
// What happens to a finished book (saved to the account, or kept on the
// page for a guest) is decided by App, the same as for a VeggieBook.

type Props = {
  flow: SecretsFlowState
  categories: SecretCategory[]
  categoriesLoading: boolean
  categoriesError: string | null
  signedIn: boolean
  onSave: (cover: string) => Promise<void>
  onCreateAccount: (cover: string) => void
  onFinishWithoutSaving: (cover: string) => void
}

export function SecretsFlow({
  flow,
  categories,
  categoriesLoading,
  categoriesError,
  signedIn,
  onSave,
  onCreateAccount,
  onFinishWithoutSaving,
}: Props) {
  const { step, category, secrets } = flow

  if (step === 'pick') {
    return (
      <SecretCategoryPicker
        categories={categories}
        loading={categoriesLoading}
        error={categoriesError}
        onSelect={flow.chooseCategory}
        onWhoSaysSo={flow.showWhoSaysSo}
      />
    )
  }

  if (step === 'who') return <WhoSaysSo />

  if (!category) return null

  if (step === 'transition') {
    return <SecretTransition categoryName={category.name} onNext={flow.toReview} />
  }

  if (step === 'review') {
    return (
      <>
        {/* The secrets are usually ready by the time the transition is
            passed; if not, the recipe skeleton, the same shape, holds the
            place. */}
        {secrets.loading && <RecipeSkeleton />}
        {secrets.error && (
          <p className="message">
            We could not load these secrets right now. Please go back and try
            again.
          </p>
        )}
        {secrets.data && (
          <SecretReview
            data={secrets.data}
            index={flow.reviewIndex}
            onDecide={flow.decide}
          />
        )}
      </>
    )
  }

  if (step === 'none') {
    return (
      <>
        <ScreenLabel>No Secrets Kept</ScreenLabel>
        <p className="message">
          You did not keep any {category.name}. A Secrets Book needs at least
          one secret.
        </p>
        <NavBar
          secondaryLabel="CHOOSE ANOTHER"
          onSecondary={flow.chooseAnother}
          primaryLabel="REVIEW AGAIN"
          onPrimary={flow.reviewAgain}
        />
      </>
    )
  }

  if (step === 'copies') {
    return (
      <SecretExtraCopies
        secrets={flow.kept}
        selected={flow.extraCopies}
        onToggle={flow.toggleCopy}
        onNext={flow.finishCopies}
      />
    )
  }

  // Every secret has a picture in the original data, so this should never
  // show. If one ever does not, the user is told rather than stuck on a
  // screen with nothing to choose.
  if (!flow.defaultCover) {
    return (
      <>
        <ScreenLabel>Choose a Cover</ScreenLabel>
        <p className="message">
          Your secrets have no pictures to use as a cover. Please choose a
          different kind of secret.
        </p>
        <NavBar primaryLabel="CHOOSE ANOTHER" onPrimary={flow.chooseAnother} />
      </>
    )
  }

  return (
    <SecretCoverChooser
      categories={categories}
      categoryId={category.id}
      categoryName={category.name}
      categoryImage={category.image}
      defaultCover={flow.defaultCover}
      signedIn={signedIn}
      onSave={onSave}
      onCreateAccount={onCreateAccount}
      onFinishWithoutSaving={onFinishWithoutSaving}
    />
  )
}