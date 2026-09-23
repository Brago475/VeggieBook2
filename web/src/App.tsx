import { useEffect, useState } from 'react'
import { LoadingScreen } from './components/LoadingScreen'
import { Masthead } from './components/Masthead'
import { useAuth } from './hooks/useAuth'
import { useBookFlow } from './hooks/useBookFlow'
import { useBooks } from './hooks/useBooks'
import { useRoute } from './hooks/useRoute'
import { useVeggieBookData } from './hooks/useVeggieBookData'
import { AccountSettings } from './pages/AccountSettings'
import { AuthForm, type AuthMode } from './pages/AuthForm'
import { BookFlow } from './pages/BookFlow'
import { BookViewer } from './pages/BookViewer'
import { HomeLibrary } from './pages/HomeLibrary'
import { Welcome } from './pages/Welcome'
import type { BookSummary, NewBook } from './types'
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
import './styles/masthead.css'
import './styles/book-card.css'
import './styles/menu.css'
import './styles/pages.css'
import './styles/account.css'
import './styles/auth.css'
import './styles/library.css'
import './styles/reading.css'
import './styles/recipe-sections.css'
import './styles/dialog.css'
import './styles/responsive.css'

// Which screen is showing comes from the address (see utils/routes.ts), so
// a refresh keeps a signed-in user where they were, and the browser's Back
// and Forward buttons move between screens. A signed-in user's book in
// progress is also kept through a refresh (see hooks/useBookFlow.ts).
//
// A guest is the exception on purpose: nothing about a guest is kept, so a
// refresh brings them back to Welcome, as before.

export default function App() {
  const { vegetables, questions, error, loading } = useVeggieBookData()
  const account = useAuth()
  const email = account.auth.status === 'signedIn' ? account.auth.email : null
  const library = useBooks(email, account.sessionEnded)
  // The email turns on saving the book in progress; null for a guest.
  const flow = useBookFlow(questions.length, email)
  const { route, path, navigate, goUp } = useRoute()

  // Chose Continue as guest. Not remembered across visits: guests leave
  // nothing behind, not even this.
  const [guest, setGuest] = useState(false)
  // A guest's finished books. This page only.
  const [guestBooks, setGuestBooks] = useState<BookSummary[]>([])
  // A guest's finished book, waiting to be saved once they have an account.
  const [pending, setPending] = useState<NewBook | null>(null)

  const view = route.view
  // The saved book being viewed, and the recipe open inside it.
  const openBook = route.view === 'book' ? route.bookId : null
  const openRecipe = route.view === 'book' ? route.recipeId : null

  const status = account.auth.status

  // Addresses that do not fit who is here are corrected to home, once the
  // sign-in check has answered:
  //   an account screen or a saved book, without an account
  //   sign in or create account, while already signed in
  //   a book in progress, for a visitor who has not chosen guest (after a
  //     guest refreshes, which by design keeps nothing)
  //   an unknown or untidy address
  useEffect(() => {
    if (status === 'loading') return

    const needsAccount = view === 'account' || view === 'book'
    const authWhileSignedIn = email !== null && (view === 'signin' || view === 'register')
    const flowWithoutVisitor = email === null && !guest && view === 'flow'
    const untidy = path !== routePath(route)

    if ((needsAccount && !email) || authWhileSignedIn || flowWithoutVisitor || untidy) {
      navigate('/', { replace: true })
    }
  }, [status, email, guest, view, path, route, navigate])

  // Back to home as a step up: the browser's Back when home is where the
  // user came from.
  function goHome() {
    setPending(null)
    goUp('/')
  }

  // Home after finishing something (saving or deleting a book, signing
  // out). The finished screen's address is replaced, so Back cannot return
  // into a book that was already saved and save it twice.
  function finishToHome() {
    setPending(null)
    navigate('/', { replace: true })
  }

  function startBook() {
    flow.start()
    navigate('/new')
  }

  function viewBook(id: string) {
    navigate(`/book/${id}`)
  }

  function openRecipeInBook(id: number | null) {
    if (!openBook) return
    if (id === null) goUp(`/book/${openBook}`)
    else navigate(`/book/${openBook}/recipe/${id}`)
  }

  // Signed in. A failure throws, and the cover screen shows the reason.
  // Once saved, the book in progress is cleared, so a refresh or the next
  // Create New VeggieBook starts fresh.
  async function saveBook(cover: string) {
    const book = flow.buildBook(cover)
    if (!book) return
    await library.saveBook(book)
    flow.start()
    finishToHome()
  }

  function finishWithoutSaving(cover: string) {
    const summary = flow.guestSummary(cover)
    if (summary) setGuestBooks((prev) => [summary, ...prev])
    flow.start()
    finishToHome()
  }

  function createAccountToSave(cover: string) {
    setPending(flow.buildBook(cover))
    navigate('/register')
  }

  // A failed sign-in or sign-up throws and stays on the form. After that the
  // user is signed in, and a guest's waiting book is saved into the account.
  // Books a guest finished without saving are not moved over.
  async function submitAuth(mode: AuthMode, address: string, password: string) {
    if (mode === 'register') await account.register(address, password)
    else await account.signIn(address, password)

    setGuestBooks([])
    const book = pending
    setPending(null)
    if (book) {
      try {
        await library.saveBook(book)
      } catch {
        // The cover screen is still set up. Signed in now, it offers SAVE
        // BOOK and shows the reason if saving fails again.
        navigate('/new', { replace: true })
        return
      }
      flow.start()
    }
    navigate('/', { replace: true })
  }

  async function signOut() {
    await account.signOut()
    setGuest(false)
    flow.start()
    finishToHome()
  }

  async function deleteAccount(password: string) {
    await account.deleteAccount(password)
    setGuest(false)
    flow.start()
    finishToHome()
  }

  async function deleteBook(id: string) {
    if (email) await library.deleteBook(id)
    else setGuestBooks((prev) => prev.filter((b) => b.id !== id))
  }

  // For the frame before the redirect above runs, show home rather than a
  // screen this visitor cannot use.
  const current =
    (view === 'account' || view === 'book') && !email ? 'home' : view
  const showWelcome = current === 'home' && status === 'guest' && !guest
  const authMode: AuthMode | null =
    current === 'signin' || current === 'register' ? current : null

  // Welcome, sign in and create account hide the green bar. They show the
  // logo in the page and run a photograph to the bottom edge, which the
  // masthead would cut off at the top.
  const onAuthScreen = showWelcome || authMode !== null

  function backAction(): (() => void) | undefined {
    if (current === 'flow') return flow.backAction(goHome)
    // Inside a book: an open recipe closes back to the list first, and only
    // the list goes home.
    if (current === 'book') {
      return openRecipe !== null ? () => openRecipeInBook(null) : goHome
    }
    if (authMode && pending) {
      return () => {
        setPending(null)
        goUp('/new')
      }
    }
    if (authMode || current === 'account') return goHome
    return undefined
  }

  // Until the sign-in check answers, it is not known which screen to show:
  // Welcome for a visitor, the library for a signed-in account. The whole
  // page is the loading screen until then, continuing the one index.html
  // showed before the app started, so a refresh never flashes white or
  // shows the wrong screen for a moment.
  if (status === 'loading') return <LoadingScreen />

  return (
    <div className="app">
      {/* The leaf ornament shows on the account screen only; the library
          and reading screens keep a plain bar so the photos lead. */}
      {!onAuthScreen && (
        <Masthead onBack={backAction()} decor={current === 'account'} />
      )}

      {error && <p className="message">Could not load: {error}</p>}

      {showWelcome && (
        <Welcome
          onCreateAccount={() => navigate('/register')}
          onSignIn={() => navigate('/signin')}
          onGuest={() => setGuest(true)}
        />
      )}

      {current === 'home' && !showWelcome && (
        <HomeLibrary
          email={email}
          books={email ? library.books : guestBooks}
          vegetables={vegetables}
          loading={library.loading}
          error={library.error}
          onCreateVeggie={startBook}
          onAccount={() => navigate('/account')}
          onSignIn={() => navigate('/signin')}
          onDeleteBook={deleteBook}
          onViewBook={email ? viewBook : undefined}
        />
      )}

      {authMode && (
        <AuthForm
          key={authMode}
          mode={authMode}
          note={
            pending && flow.vegetable
              ? `Create an account or sign in to save your ${flow.vegetable.name} VeggieBook.`
              : undefined
          }
          onSubmit={(address, password) => submitAuth(authMode, address, password)}
          onSwitchMode={() =>
            navigate(authMode === 'signin' ? '/register' : '/signin', { replace: true })
          }
          onBack={backAction()}
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

      {current === 'flow' && (
        <BookFlow
          flow={flow}
          vegetables={vegetables}
          questions={questions}
          loading={loading}
          signedIn={email !== null}
          onSave={saveBook}
          onCreateAccount={createAccountToSave}
          onFinishWithoutSaving={finishWithoutSaving}
        />
      )}

      {current === 'book' && openBook && (
        <BookViewer
          bookId={openBook}
          vegetables={vegetables}
          openRecipe={openRecipe}
          onOpenRecipe={openRecipeInBook}
          onClose={goHome}
          onDelete={async (id) => {
            await deleteBook(id)
            finishToHome()
          }}
          onChanged={library.reload}
        />
      )}
    </div>
  )
}