import { useMemo, useState } from 'react'
import CampaignUpdateModal from './CampaignUpdateModal'
import MarkdownContent from '$components/markdown/MarkdownContent'
import {
  CAMPAIGN_UPDATE_PUBLIC_PREVIEW_LENGTH,
  formatCampaignUpdateDate,
  getCampaignUpdateMarkdownPreview,
} from './campaignUpdateUtils'
import './CampaignUpdates.css'

function PublicUpdateCard({ update, number, onOpen }) {
  const preview = useMemo(
    () => getCampaignUpdateMarkdownPreview(update.content, CAMPAIGN_UPDATE_PUBLIC_PREVIEW_LENGTH),
    [update.content]
  )

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen(update)
    }
  }

  return (
    <article
      className="cu-public-card"
      onClick={() => onOpen(update)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="cu-public-head">
        <div>
          <span className="cu-public-kicker">Actualización #{number}</span>
          <h3 className="cu-public-title">{update.title}</h3>
        </div>
        <span className="cu-public-date">{formatCampaignUpdateDate(update.createdAt)}</span>
      </div>
      <MarkdownContent content={preview.text} className="cu-public-excerpt" />
      {preview.truncated ? (
        <div className="cu-public-more">
          <span>leer más...</span>
        </div>
      ) : null}
    </article>
  )
}

export default function CampaignUpdatesTab({ updates }) {
  const [selectedUpdate, setSelectedUpdate] = useState(null)

  if (!updates?.length) {
    return (
      <div className="cp-content-grid">
        <div className="cp-main cp-main--full">
          <h2>Actualizaciones</h2>
          <p className="cp-placeholder-text">El creador todavía no publicó novedades sobre este proyecto.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="cp-content-grid">
        <div className="cp-main cp-main--full">
          <h2>Actualizaciones</h2>
          <div className="cu-public-list">
            {updates.map((update, index) => (
              <PublicUpdateCard
                key={update.id}
                update={update}
                number={updates.length - index}
                onOpen={setSelectedUpdate}
              />
            ))}
          </div>
        </div>
      </div>
      <CampaignUpdateModal update={selectedUpdate} onClose={() => setSelectedUpdate(null)} />
    </>
  )
}
