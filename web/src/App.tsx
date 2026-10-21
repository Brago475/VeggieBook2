import { useEffect, useState } from 'react'
import { BookSkeleton } from './components/library/BookSkeleton'
import { LegalPage } from './components/layout/LegalPage'
import { LoadingScreen } from './components/layout/LoadingScreen'
import { Masthead } from './components/layout/Masthead'
import { SiteFooter } from './components/layout/SiteFooter'
import { PRIVACY } from './content/privacy'
import { TERMS } from './content/terms'
import { useAuth, type RegisterForm } from './hooks/useAuth'
import { useBookFlow } from './hooks/useBookFlow'
import { useBooks } from './hooks/useBooks'
import { SKELETON_MIN_MS, useHeld } from './hooks/useHeld'
import { useRoute } from './hooks/useRoute'
import { useSecretCategories } from './hooks/useSecrets'
import { useSecretsFlow } from './hooks/useSecretsFlow'
import { useSplash } from './hooks/useSplash'
import { useVeggieBookData } from './hooks/useVeggieBookData'
import { BOOK } from './i18n/strings/book'
import { useStrings } from './i18n/useStrings'
import { About } from './pages/About'
import { AccountSettings } from './pages/AccountSettings'
import { AuthForm } from './pages/AuthForm'
import { BookFlow } from './pages/BookFlow'
import { BookSaved } from './pages/BookSaved'
import { BookViewer } from './pages/BookViewer'
import { ChangeSecretCover } from './pages/ChangeSecretCover'
import { ChangeVeggieCover } from './pages/ChangeVeggieCover'
import { CreateAccount } from './pages/CreateAccount'
import { ForgotPassword } from './pages/ForgotPassword'
import { HomeLibrary } from './pages/HomeLibrary'
import { SecretBookViewer } from './pages/SecretBookViewer'
import { SecretsFlow } from './pages/SecretsFlow'
import { Welcome } from './pages/Welcome'
import { routePath } from './utils/routes'

// Stylesheet order is load order, and load order decides who wins a tie.
// Tokens first so the variables exist, then base, then the shared pieces,
// then the screens built on them, then responsive last so its overrides
// are not beaten by a rule of equal specificity further down.
//
// The loading screen's styles are not here: they live in index.html so
// they apply before this bundle has loaded.
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/landmarks.css'
import './styles/skeleton.css'
import './styles/masthead.css'
import './styles/book-card.css'
import './styles/menu.css'
import './styles/main-menu.css'
import './styles/pages.css'
import './styles/account.css'
import './styles/auth.css'
import './styles/auth-extras.css'
import './styles/library.css'
import './styles/reading.css'
import './styles/recipe-sections.css'
import './styles/secrets.css'
import './styles/book-saved.css'
import './styles/about.css'
import './styles/legal.css'
import './styles/footer.css'
import './styles/dialog.css'
import './styles/responsive.css'

// Which screen is showing comes from the address (see utils/routes.ts), so
// a refresh keeps the visitor where they were, and the browser's Back and
// Forward buttons move between screens.
//
// Who is here (see hooks/useAuth.ts):
//   visitor   nobody signed in. Welcome, About, Terms, Privacy, and the
//             account screens.
//   guest     a temporary account. Makes, saves, and reads books like an
//             account. Deleted on sign out, or after 24 hours.
//   signedIn  a real account, with account settings.
//
// A signed-in account's book in progress, of either kind, is also kept
// through a refresh (see hooks/useBookFlow.ts and hooks/useSecretsFlow.ts).
// A guest's saved books survive a refresh; their book in progress does not.
//
// Right after a book is saved, home shows the saved screen (pages/
// BookSaved.tsx) until Skip. It is held here, not in the address, so a
// refresh lands on the library and a book can never be saved twice.

type JustSaved = { id: string; kind: 'veggie' | 'secrets' }

export default function App() {
  const { vegetables, questions, error, loading } = useVeggieBookData()
  // The five Secrets categories, loaded once: the Secrets flow shows them,
  // and the home screen names and pictures saved Secrets Books with them.
  const secretCategories = useSecretCategories()
  const account = useAuth()
  const auth = account.auth
  const status = auth.status
  const bookWords = useStrings(BOOK)

  const email = auth.status === 'signedIn' ? auth.email : null
  // The username shown on home; null for a guest or an older account.
  const displayName = auth.status === 'signedIn' ? auth.displayName : null
  const isGuest = auth.status === 'guest'
  // A guest or an account: someone whose books the server keeps.
  const hasSession = email !== null || isGuest

  // Whose books the list holds: the account's email, or this guest
  // session's own key, so one guest never sees another's books.
  const owner =
    auth.status === 'signedIn' ? auth.email : auth.status === 'guest' ? auth.key : null
  const library = useBooks(owner, account.sessionEnded)

  // The email turns on keeping the book in progress through a refresh;
  // null for a guest.
  const flow = useBookFlow(questions.length, email)
  const secrets = useSecretsFlow(email)
  const { route, path, navigate, goUp } = useRoute()

  // The book that was just saved, while its saved screen shows.
  const [justSaved, setJustSaved] = useState<JustSaved | null>(null)

  // First-load screen, held until the app is ready, then faded out.
  const splash = useSplash(status !== 'loading')
  // Home book skeleton, held long enough to be seen.
  const booksLoading = useHeld(library.loading, SKELETON_MIN_MS)

  const view = route.view
  // The saved book being viewed, the recipe or secret open inside it, and
  // whether its cover is being changed.
  const openBook = route.view === 'book' ? route.bookId : null
  const openRecipe = route.view === 'book' ? route.recipeId : null
  const openSecret = route.view === 'book' ? route.secretId : null
  const editingCover = route.view === 'book' ? route.cover : false

  // Which viewer a saved book needs. An open recipe or secret in the
  // address already says; otherwise the book list, which the home screen
  // has loaded, knows each book's kind. Null while that list is still
  // loading, for example after a refresh on a book's address.
  const openBookKind: 'veggie' | 'secrets' | null =
    openSecret !== null
      ? 'secrets'
      : openRecipe !== null
        ? 'veggie'
        : openBook
          ? (library.books.find((b) => b.id === openBook)?.kind ??
            (library.loading ? null : 'veggie'))
          : null

  // Screens that need someone the server knows (a guest or an account),
  // and screens that need a real account.
  const needsSession = view === 'book' || view === 'flow' || view === 'secrets'
  const needsAccount = view === 'account'

  // Addresses that do not fit who is here are corrected to home, once the
  // sign-in check has answered:
  //   account settings, without a real account
  //   a book, saved or in progress, without a guest session or an account
  //   sign in or create account, while already signed in to an account
  //     (a guest may use both, to move to a real account)
  //   an unknown or untidy address
  // About, Terms, Privacy, and Forgot password are open to everyone.
  useEffect(() => {
    if (status === 'loading') return

    const authWhileSignedIn = email !== null && (view === 'signin' || view === 'register')
    const untidy = path !== routePath(route)

    if (
      (needsAccount && !email) ||
      (needsSession && !hasSession) ||
      authWhileSignedIn ||
      untidy
    ) {
      navigate('/', { replace: true })
    }
  }, [status, email, hasSession, needsAccount, needsSession, view, path, route, navigate])

  // Back to home as a step up: the browser's Back when home is where the
  // user came from.
  function goHome() {
    goUp('/')
  }

  // Home after finishing something (saving or deleting a book, signing
  // out). The finished screen's address is replaced, so Back cannot return
  // into a book that was already saved and save it twice.
  function finishToHome() {
    navigate('/', { replace: true })
  }

  function startBook() {
    setJustSaved(null)
    flow.start()
    navigate('/new')
  }

  function startSecrets() {
    setJustSaved(null)
    secrets.start()
    navigate('/secrets')
  }

  function viewBook(id: string) {
    setJustSaved(null)
    navigate(`/book/${id}`)
  }

  function openRecipeInBook(id: number | null) {
    if (!openBook) return
    if (id === null) goUp(`/book/${openBook}`)
    else navigate(`/book/${openBook}/recipe/${id}`)
  }

  function openSecretInBook(id: number | null) {
    if (!openBook) return
    if (id === null) goUp(`/book/${openBook}`)
    else navigate(`/book/${openBook}/secret/${id}`)
  }

  // --- changing a saved book's cover ---

  function changeCover() {
    if (openBook) navigate(`/book/${openBook}/cover`)
  }

  function leaveCover() {
    if (openBook) goUp(`/book/${openBook}`)
  }

  // A failure throws, and the change-cover screen shows the reason. On
  // success the home list is refreshed, and the book opens with its new
  // cover.
  async function saveCover(cover: string) {
    if (!openBook) return
    await library.changeCover(openBook, cover)
    leaveCover()
  }

  // --- finishing a book ---

  // A guest or an account. A failure throws, and the cover screen shows the
  // reason. Once saved, the book in progress is cleared, so a refresh or the
  // next Create New starts fresh, and the saved screen shows.
  async function saveBook(cover: string) {
    const book = flow.buildBook(cover)
    if (!book) return
    const id = await library.saveBook(book)
    flow.start()
    setJustSaved({ id, kind: 'veggie' })
    finishToHome()
  }

  async function saveSecrets(cover: string) {
    const book = secrets.buildBook(cover)
    if (!book) return
    const id = await library.saveSecretsBook(book)
    secrets.start()
    setJustSaved({ id, kind: 'secrets' })
    finishToHome()
  }

  // --- signing in and out ---

  // Both sign in and Create Account sign in right away. A failure throws
  // and stays on the form.
  function afterSignIn() {
    setJustSaved(null)
    flow.start()
    secrets.start()
    navigate('/', { replace: true })
  }

  async function submitSignIn(address: string, password: string, keepGuestBooks: boolean) {
    await account.signIn(address, password, keepGuestBooks)
    afterSignIn()
  }

  async function submitRegister(form: RegisterForm) {
    await account.register(form)
    afterSignIn()
  }

  // For a guest, this also deletes the guest and all their books.
  async function signOut() {
    await account.signOut()
    setJustSaved(null)
    flow.start()
    secrets.start()
    finishToHome()
  }

  async function deleteAccount(password: string) {
    await account.deleteAccount(password)
    setJustSaved(null)
    flow.start()
    secrets.start()
    finishToHome()
  }

  async function deleteBook(id: string) {
    await library.deleteBook(id)
  }

  // For the frame before the redirect above runs, show home rather than a
  // screen this visitor cannot use.
  const current =
    (needsAccount && !email) || (needsSession && !hasSession) ? 'home' : view
  const showWelcome = current === 'home' && status === 'visitor'
  const authPage = current === 'signin' || current === 'register'
  const passwordPage = current === 'forgotPassword'
  const readingPage =
    current === 'about' || current === 'terms' || current === 'privacy'

  // The book on the saved screen, as the home list now holds it.
  const savedBook =
    current === 'home' && !showWelcome && justSaved
      ? library.books.find((b) => b.id === justSaved.id) ?? null
      : null
  const savedVegetable = savedBook
    ? vegetables.find((v) => v.code === savedBook.vegetableCode)
    : undefined
  const savedCategory = savedBook
    ? secretCategories.categories.find((c) => c.id === savedBook.secretCategoryId)
    : undefined
  const showSaved = savedBook !== null

  // Welcome and every account screen hide the green bar. They show the logo
  // in the page and run a photograph to the bottom edge, which the masthead
  // would cut off at the top.
  const onAuthScreen = showWelcome || authPage || passwordPage

  // The SecretsBook logo while making, reading, or just having saved a
  // Secrets Book, as in the original app; the VeggieBook logo everywhere
  // else.
  const mastheadBrand: 'veggie' | 'secrets' =
    current === 'secrets' ||
    (current === 'book' && openBookKind === 'secrets') ||
    savedBook?.kind === 'secrets'
      ? 'secrets'
      : 'veggie'

  function backAction(): (() => void) | undefined {
    if (current === 'flow') return flow.backAction(goHome)
    if (current === 'secrets') return secrets.backAction(goHome)
    // Inside a book: the change-cover screen, an open recipe, or an open
    // secret closes back to the book first, and only the book goes home.
    if (current === 'book') {
      if (editingCover) return leaveCover
      if (openRecipe !== null) return () => openRecipeInBook(null)
      if (openSecret !== null) return () => openSecretInBook(null)
      return goHome
    }
    if (current === 'forgotPassword') return () => goUp('/signin')
    if (authPage || current === 'account' || readingPage) return goHome
    return undefined
  }

  const showBook = current === 'book' && openBook !== null

  // The footer shows on the main screens: Welcome, home, account, the
  // reading pages, and reading a saved book. It stays off while a book is
  // being made or its cover changed, so it never sits under the NEXT, KEEP
  // or SAVE buttons, off on the account screens, so nothing pulls
  // attention from the form, and off on the saved screen.
  const showFooter =
    (current === 'home' && !showSaved) ||
    current === 'account' ||
    readingPage ||
    (showBook && !editingCover)

  // The app renders under the loading screen once the sign-in check answers,
  // so the fade reveals the right screen with no white flash.
  return (
    <>
      {status !== 'loading' && (
        <div className="app">
          {/* The leaf ornament shows on the account screen only; the library
              and reading screens keep a plain bar so the photos lead. */}
          {!onAuthScreen && (
            <Masthead
              brand={mastheadBrand}
              onBack={backAction()}
              decor={current === 'account'}
            />
          )}

          {/* The main landmark for screen readers. It has no box of its own
              (styles/landmarks.css), so the layout is unchanged. */}
          <main className="app-main">
            {error && <p className="message">Could not load: {error}</p>}

            {showWelcome && (
              <Welcome
                onCreateAccount={() => navigate('/register')}
                onSignIn={() => navigate('/signin')}
                onGuest={account.startGuest}
              />
            )}

            {showSaved && savedBook && (
              <BookSaved
                bookId={savedBook.id}
                title={
                  savedBook.kind === 'secrets'
                    ? (savedCategory?.name ?? bookWords.secretsFallback)
                    : (savedVegetable?.name ?? bookWords.veggieLabel)
                }
                background={
                  savedBook.kind === 'secrets'
                    ? (savedCategory?.image ?? null)
                    : savedVegetable
                      ? `cover/${savedVegetable.shortCode}.jpg`
                      : null
                }
                cover={savedBook.cover}
                label={savedBook.kind === 'secrets' ? bookWords.secretsLabel : bookWords.veggieLabel}
                count={savedBook.recipeCount}
                countNoun={savedBook.kind === 'secrets' ? 'secret' : 'recipe'}
                onDone={() => setJustSaved(null)}
              />
            )}

            {current === 'home' && !showWelcome && !showSaved && (
              <HomeLibrary
                email={email}
                displayName={displayName}
                books={booksLoading ? [] : library.books}
                vegetables={vegetables}
                secretCategories={secretCategories.categories}
                loading={booksLoading}
                error={library.error}
                onCreateVeggie={startBook}
                onCreateSecrets={startSecrets}
                onAccount={() => navigate('/account')}
                onRegister={() => navigate('/register')}
                onSignIn={() => navigate('/signin')}
                onSignOut={signOut}
                onAbout={() => navigate('/about')}
                onDeleteBook={deleteBook}
                onViewBook={viewBook}
              />
            )}

            {current === 'signin' && (
              <AuthForm
                guestBookCount={isGuest ? library.books.length : 0}
                onSubmit={submitSignIn}
                onForgotPassword={() => navigate('/forgot-password')}
                onCreateAccount={() => navigate('/register', { replace: true })}
                onBack={backAction()}
              />
            )}

            {current === 'register' && (
              <CreateAccount
                guestBookCount={isGuest ? library.books.length : 0}
                onSubmit={submitRegister}
                onSignIn={() => navigate('/signin', { replace: true })}
                onBack={backAction()}
              />
            )}

            {current === 'forgotPassword' && (
              <ForgotPassword
                onBack={backAction()}
                onSignIn={() => navigate('/signin', { replace: true })}
              />
            )}

            {current === 'account' && email && (
              <AccountSettings
                email={email}
                onSignOut={signOut}
                onChangePassword={account.changePassword}
                onDeleteAccount={deleteAccount}
              />
            )}

            {/* Open to everyone: a visitor, a guest, or an account. */}
            {current === 'about' && <About />}
            {current === 'terms' && <LegalPage doc={TERMS} />}
            {current === 'privacy' && <LegalPage doc={PRIVACY} />}

            {current === 'flow' && (
              <BookFlow
                flow={flow}
                vegetables={vegetables}
                questions={questions}
                loading={loading}
                onSave={saveBook}
              />
            )}

            {current === 'secrets' && (
              <SecretsFlow
                flow={secrets}
                categories={secretCategories.categories}
                categoriesLoading={secretCategories.loading}
                categoriesError={secretCategories.error}
                onSave={saveSecrets}
              />
            )}

            {/* A saved book: the skeleton until its kind is known, then the
                screen for that kind, either its viewer or its change-cover
                screen. */}
            {showBook && openBookKind === null && <BookSkeleton />}

            {showBook && openBookKind === 'veggie' && editingCover && (
              <ChangeVeggieCover
                bookId={openBook}
                vegetables={vegetables}
                onSave={saveCover}
                onCancel={leaveCover}
              />
            )}

            {showBook && openBookKind === 'secrets' && editingCover && (
              <ChangeSecretCover
                bookId={openBook}
                categories={secretCategories.categories}
                onSave={saveCover}
                onCancel={leaveCover}
              />
            )}

            {showBook && openBookKind === 'veggie' && !editingCover && (
              <BookViewer
                bookId={openBook}
                vegetables={vegetables}
                openRecipe={openRecipe}
                onOpenRecipe={openRecipeInBook}
                onClose={goHome}
                onChangeCover={changeCover}
                onDelete={async (id) => {
                  await deleteBook(id)
                  finishToHome()
                }}
                onChanged={library.reload}
              />
            )}

            {showBook && openBookKind === 'secrets' && !editingCover && (
              <SecretBookViewer
                bookId={openBook}
                openSecret={openSecret}
                onOpenSecret={openSecretInBook}
                onClose={goHome}
                onChangeCover={changeCover}
                onDelete={async (id) => {
                  await deleteBook(id)
                  finishToHome()
                }}
                onChanged={library.reload}
              />
            )}
          </main>

          {/* Each footer link is left out on its own page. */}
          {showFooter && (
            <SiteFooter
              onAbout={current === 'about' ? undefined : () => navigate('/about')}
              onTerms={current === 'terms' ? undefined : () => navigate('/terms')}
              onPrivacy={current === 'privacy' ? undefined : () => navigate('/privacy')}
            />
          )}
        </div>
      )}

      {splash !== 'gone' && <LoadingScreen leaving={splash === 'leaving'} />}
    </>
  )
}