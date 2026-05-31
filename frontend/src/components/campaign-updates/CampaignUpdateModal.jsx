import { useEffect } from 'react'
import { X } from 'lucide-react'
import MarkdownContent from '$components/markdown/MarkdownContent'
import { formatCampaignUpdateDate } from './campaignUpdateUtils'
import './CampaignUpdates.css'

export default function CampaignUpdateModal({ update, onClose }) {
  useEffect(() => {
    if (!update) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [update, onClose])

  if (!update) return null

  return (
    <div className="cu-overlay" onClick={onClose}>
      <article className="cu-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="cu-modal-close" onClick={onClose} aria-label="Cerrar actualización">
          <X size={18} />
        </button>
        <span className="cu-modal-kicker">Actualización del proyecto</span>
        <h3 className="cu-modal-title">{update.title}</h3>
        <p className="cu-modal-date">{formatCampaignUpdateDate(update.createdAt)}</p>
        <MarkdownContent content={update.content} className="cu-markdown" />
      </article>
    </div>
  )
}
