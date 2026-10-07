import { useEffect, useState } from 'react'
import type { AccountInfo, AdminBook } from '../../types/admin'
import { api } from '../../utils/api'
import { formatDate, formatDateTime } from '../../utils/format'
import { AccountActions } from './AccountActions'
import { BookCard } from './BookCard'

// One account: its details, the admin actions, and its books.
//
// Never shown here, because the API never sends them: first and last name,
// password, recovery PIN, security question and answer, and uploaded photos.
//
// The root admin's Admin role is shown in gold, matching the header and the
// accounts list.

type Props = {
  id: string
  currentEmail: string
  onBack: () => void
}

export function AccountDetail({ id, currentEmail, onBack }: Props) {
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [books, setBooks] = useState<AdminBook[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Bumped after an action, to load the account again.
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api<AccountInfo>(`/admin/accounts/${id}`),
      api<AdminBook[]>(`/admin/accounts/${id}/books`),
    ])
      .then(([a, b]) => {
        if (cancelled) return
        setAccount(a)
        setBooks(b)
        setError(null)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [id, version])

  return (
    <>
      <button type="button" className="back-button" onClick={onBack}>
        ← Back to accounts
      </button>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {!account && !error && <p className="muted">Loading...</p>}

      {account && (
        <>
          <h1 className="page-title">{account.email}</h1>

          <div className="detail-grid">
            <section className="card">
              <h2 className="section-title">Account</h2>
              <dl className="info">
                <dt>Username</dt>
                <dd>{account.username}</dd>
                <dt>Roles</dt>
                <dd>
                  {account.roles.map((role, i) => (
                    <span key={role}>
                      {i > 0 && ', '}
                      <span
                        className={
                          role === 'Admin' && account.isRootAdmin ? 'root-text' : undefined
                        }
                      >
                        {role}
                      </span>
                    </span>
                  ))}
                </dd>
                <dt>Age range</dt>
                <dd>{account.ageRange ?? 'Not given'}</dd>
                <dt>Created</dt>
                <dd>{formatDate(account.createdAt)}</dd>
                <dt>Terms accepted</dt>
                <dd>
                  {account.termsVersion
                    ? `Version ${account.termsVersion} on ${formatDate(account.termsAcceptedAt)}`
                    : 'Not recorded'}
                </dd>
                <dt>Books</dt>
                <dd>{account.bookCount}</dd>
                <dt>Account ID</dt>
                <dd className="mono">{account.id}</dd>
              </dl>
            </section>

            <AccountActions
              account={account}
              currentEmail={currentEmail}
              onChanged={() => setVersion((v) => v + 1)}
            />
          </div>

          {account.signInLockedUntil && (
            <p className="note">
              Sign-in is locked after too many wrong passwords until{' '}
              {formatDateTime(account.signInLockedUntil)}. It clears on its own.
            </p>
          )}

          <h2 className="section-title books-title">Books</h2>
          {books && books.length === 0 && <p className="muted">No saved books.</p>}
          <div className="book-list">
            {books?.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </>
      )}
    </>
  )
}