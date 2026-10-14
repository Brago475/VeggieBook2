import { useEffect, useState } from 'react'
import { COMMON } from '../../i18n/strings/common'
import { HOME } from '../../i18n/strings/home'
import { useStrings } from '../../i18n/useStrings'
import { answerStudyNotice, getStudyNotice, getTracking } from '../../utils/trackingApi'
import { CloseIcon, LeafIcon } from '../icons/ResearchIcons'
import '../../styles/research.css'

// The study notice, a card at the top of the home screen. It shows only
// while a study runs, only to people who turned research tracking off
// themselves, and only until they answer it once for that study (the API
// decides; see api/Research/TrackingController.cs). It never covers the
// page, so the books stay right there.
//
//   Join the study   turns tracking back on, and the card becomes a short
//                    thank-you with their research ID
//   Not now          they stay out; the card goes away and doesn't come
//                    back for this study
//
// Only rendered for a signed-in account (HomeLibrary.tsx); guests and
// admin accounts never get it.

type State = 'hidden' | 'asking' | 'joined'

export function StudyNoticeCard() {
  const t = useStrings(HOME)
  const common = useStrings(COMMON)

  const [state, setState] = useState<State>('hidden')
  const [researchId, setResearchId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getStudyNotice()
      .then((n) => {
        if (!cancelled && n.show) setState('asking')
      })
      .catch(() => {
        // Not being able to ask is not worth an error on the home screen.
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function answer(choice: 'joined' | 'stayed_out') {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await answerStudyNotice(choice)
      if (choice === 'stayed_out') {
        setState('hidden')
        return
      }
      const tracking = await getTracking().catch(() => null)
      setResearchId(tracking && tracking.eligible ? tracking.researchId : null)
      setState('joined')
    } catch (err) {
      setError(err instanceof Error ? err.message : common.somethingWrong)
    } finally {
      setBusy(false)
    }
  }

  if (state === 'hidden') return null

  if (state === 'joined') {
    return (
      <div className="study-notice is-thanks" role="status">
        <span className="study-notice-check" aria-hidden="true">
          &#10003;
        </span>
        <p className="study-notice-thanks">
          {t.noticeThanks}
          {researchId && (
            <>
              {' '}
              {t.noticeYourId} <strong>{researchId}</strong>.
            </>
          )}
        </p>
        <button
          type="button"
          className="study-notice-close"
          aria-label={common.close}
          onClick={() => setState('hidden')}
        >
          <CloseIcon />
        </button>
      </div>
    )
  }

  return (
    <section className="study-notice" aria-labelledby="study-notice-title">
      <div className="study-notice-head">
        <span className="study-notice-icon">
          <LeafIcon />
        </span>
        <h2 className="study-notice-title" id="study-notice-title">
          {t.noticeTitle}
        </h2>
      </div>
      <p className="study-notice-text">{t.noticeText}</p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="study-notice-actions">
        <button type="button" className="study-notice-join" onClick={() => void answer('joined')} disabled={busy}>
          {busy ? common.pleaseWait : t.noticeJoin}
        </button>
        <button type="button" className="study-notice-later" onClick={() => void answer('stayed_out')} disabled={busy}>
          {t.noticeNotNow}
        </button>
      </div>
    </section>
  )
}