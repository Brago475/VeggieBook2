import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { LanguageProvider } from './i18n/LanguageProvider'

// Styles are imported in App.tsx, in cascade order: tokens, base,
// components, pages. LanguageProvider wraps the app so every screen and
// content hook reads the same language. ErrorBoundary sits inside it so the
// crash screen can use the visitor's language.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </LanguageProvider>
  </StrictMode>,
)