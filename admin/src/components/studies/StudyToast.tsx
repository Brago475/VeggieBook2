import { useEffect } from 'react'
import { StudyIcon } from './StudyIcons'

// A short message in the corner after a change ("Renamed Study 2 to Fall
// pilot.", "Deleted Study 1."). It goes away by itself after a few seconds,
// or with its X. Screen readers read it out.

type Props = {
  message: string
  onClose: () => void
}

const SHOW_FOR_MS = 4000

export function StudyToast({ message, onClose }: Props) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, SHOW_FOR_MS)
    return () => window.clearTimeout(timer)
  }, [message, onClose])

  return (
    <div className="se-toast" role="status">
      <span className="se-toast-icon">
        <StudyIcon name="check" size={16} />
      </span>
      {message}
      <button type="button" className="se-toast-close" aria-label="Close" onClick={onClose}>
        <StudyIcon name="close" size={14} />
      </button>
    </div>
  )
}