import { NavBar } from '../components/layout/NavBar'
import { RecipeSkeleton } from '../components/veggie/RecipeSkeleton'
import { ScreenLabel } from '../components/layout/ScreenLabel'
import { useHeld } from '../hooks/useHeld'
import type { SecretsFlowState } from '../hooks/useSecretsFlow'
import { SECRETS } from '../i18n/strings/secrets'
import { useStrings } from '../i18n/useStrings'
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
// Every bottom button is NavBar, so both kinds of book have one button
// layout. A finished book is saved for a guest and an account alike.

type Props = {
  flow: SecretsFlowState
  categories: SecretCategory[]
  categoriesLoading: boolean
  categoriesError: string | null
  onSave: (cover: string) => Promise<void>
}

export function SecretsFlow({
  flow,
  categories,
  categoriesLoading,
  categoriesError,
  onSave,
}: Props) {
  const t = useStrings(SECRETS)
  const { step, category, secrets } = flow
  // The review skeleton, held long enough to be seen.
  const loadingSecrets = useHeld(step === 'review' && secrets.loading)

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
        {loadingSecrets && <RecipeSkeleton />}
        {!loadingSecrets && secrets.error && <p className="message">{t.loadError}</p>}
        {!loadingSecrets && secrets.data && (
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
        <ScreenLabel>{t.noneKept}</ScreenLabel>
        <p className="message">{t.noneText(category.name)}</p>
        <NavBar
          secondaryLabel={t.chooseAnother}
          onSecondary={flow.chooseAnother}
          primaryLabel={t.reviewAgain}
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
  // show. If one ever does not, the user is told rather than stuck.
  if (!flow.defaultCover) {
    return (
      <>
        <ScreenLabel>{t.chooseCoverLabel}</ScreenLabel>
        <p className="message">{t.noPictures}</p>
        <NavBar primaryLabel={t.chooseAnother} onPrimary={flow.chooseAnother} />
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
      onSave={onSave}
    />
  )
}