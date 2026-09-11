import { useState } from 'react'
import { Masthead } from './components/Masthead'
import { useAuth } from './hooks/useAuth'
import { useBookFlow } from './hooks/useBookFlow'
import { useBooks } from './hooks/useBooks'
import { useVeggieBookData } from './hooks/useVeggieBookData'
import { AccountSettings } from './pages/AccountSettings'
import { AuthForm, type AuthMode } from './pages/AuthForm'
import { BookFlow } from './pages/BookFlow'
import { HomeLibrary } from './pages/HomeLibrary'
import { Welcome } from './pages/Welcome'
import type { BookSummary, NewBook } from './types'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/pages.css'
import './styles/account.css'
import './styles/library.css'
import './styles/responsive.css'

// Top-level screens. Making a book is one view ('flow'); its steps live in
// hooks/useBookFlow.ts and pages/BookFlow.tsx.
type View = 'home' | 'signin' | 'register' | 'account' | 'flow'

export default function App() {
  const { vegetables, questions, error, loading } = useVeggieBookData()
  const account = useAuth()
  const email = account.auth.status === 'signedIn' ? account.auth.email : null
  const library = useBooks(email, account.sessionEnded)
  const flow = useBookFlow(questions.length)

  const [view, setView] = useState<View>('home')
  // Chose Continue as guest. Not remembered across visits: guests leave
  // nothing behind, not even this.
  const [guest, setGuest] = useState(false)
  // A guest's finished books. This page only.
  const [guestBooks, setGuestBooks] = useState<BookSummary[]>([])
  // A guest's finished book, waiting to be saved once they have an account.
  const [pending, setPending] = useState<NewBook | null>(null)

  function goHome() {
    setPending(null)
    setView('home')
  }

  function startBook() {
    flow.start()
    setView('flow')
  }

  // Signed in. A failure throws, and the cover screen shows the reason.
  async function saveBook(cover: string) {
    const book = flow.buildBook(cover)
    if (!book) return
    await library.saveBook(book)
    goHome()
  }

  function finishWithoutSaving(cover: string) {
    const summary = flow.guestSummary(cover)
    if (summary) setGuestBooks((prev) => [summary, ...prev])
    goHome()
  }

  function createAccountToSave(cover: string) {
    setPending(flow.buildBook(cover))
    setView('register')
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
        setView('flow')
        return
      }
    }
    setView('home')
  }

  async function signOut() {
    await account.signOut()
    setGuest(false)
    goHome()
  }

  async function deleteAccount(password: string) {
    await account.deleteAccount(password)
    setGuest(false)
    goHome()
  }

  async function deleteBook(id: string) {
    if (email) await library.deleteBook(id)
    else setGuestBooks((prev) => prev.filter((b) => b.id !== id))
  }

  const status = account.auth.status
  // A session that ends while on the account screen falls back to home.
  const current: View = view === 'account' && !email ? 'home' : view
  const showWelcome = current === 'home' && status === 'guest' && !guest
  const authMode: AuthMode | null =
    current === 'signin' || current === 'register' ? current : null

  function backAction(): (() => void) | undefined {
    if (current === 'flow') return flow.backAction(goHome)
    if (authMode && pending) {
      return () => {
        setPending(null)
        setView('flow')
      }
    }
    if (authMode || current === 'account') return goHome
    return undefined
  }

  return (
    <div className="app">
      <Masthead onBack={backAction()} />

      {error && <p className="message">Could not load: {error}</p>}
      {status === 'loading' && <p className="message">Loading...</p>}

      {showWelcome && (
        <Welcome
          onCreateAccount={() => setView('register')}
          onSignIn={() => setView('signin')}
          onGuest={() => setGuest(true)}
        />
      )}

      {status !== 'loading' && current === 'home' && !showWelcome && (
        <HomeLibrary
          email={email}
          books={email ? library.books : guestBooks}
          vegetables={vegetables}
          loading={library.loading}
          error={library.error}
          onCreateVeggie={startBook}
          onAccount={() => setView('account')}
          onSignIn={() => setView('signin')}
          onDeleteBook={deleteBook}
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
          onSwitchMode={() => setView(authMode === 'signin' ? 'register' : 'signin')}
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
    </div>
  )
}