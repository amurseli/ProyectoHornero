import { useState, useRef } from "react"
import { FiCalendar, FiTrendingUp } from "react-icons/fi"
import ReactPlayer from "react-player"

function CampaignCard({ campaign, variant = "featured" }) {
  const goal = campaign.goal || campaign.targetAmount || 0
  const raised = campaign.currentAmount ?? campaign.raised ?? 0
  const progressPercentage = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0
  const daysLeft = campaign.daysLeft ?? 0
  const videoUrl = campaign.videoUrl || null
  if (videoUrl) console.log('VIDEO FOUND:', campaign.title, videoUrl)

  const [hovered, setHovered] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const hoverTimer = useRef(null)

  const handleMouseEnter = () => {
    if (!videoUrl) return
    hoverTimer.current = setTimeout(() => setHovered(true), 1000)
  }

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current)
    setHovered(false)
  }

  if (variant === "compact" || variant === "spotlight") {
    return (
      <a href={`/campaign/${campaign.id}`} className="campaign-card-compact">
        <img
          src={campaign.imageUrl || campaign.image || "/crowdfunding-campaign.jpg"}
          alt={campaign.title}
          className="campaign-compact-image"
        />
        <div className="campaign-compact-content">
          <p className="campaign-compact-status">
            {campaign.status || campaign.category || "Campaña"}
          </p>
          <h3 className="campaign-compact-title">{campaign.title}</h3>
          <p className="campaign-compact-date">
            {campaign.createdAt && new Date(campaign.createdAt).toLocaleDateString("es-ES", {
              day: "numeric", month: "short",
            })}
          </p>
        </div>
        <style>{compactStyles}</style>
      </a>
    )
  }

  return (
    <a href={`/campaigns/${campaign.id}`} className="campaign-card-full">
      <div
        className="campaign-thumbnail"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={campaign.imageUrl || campaign.image || "/crowdfunding-campaign.jpg"}
          alt={campaign.title}
          className="campaign-image"
        />
        {videoUrl && (
          <div className={`campaign-video-overlay ${hovered && videoReady ? 'visible' : ''}`}>
            <ReactPlayer
              src={videoUrl}
              playing={hovered}
              muted
              loop
              width="100%"
              height="100%"
              onReady={() => setVideoReady(true)}
              config={{
                youtube: { playerVars: { controls: 0, modestbranding: 1, rel: 0 } },
                vimeo: { playerOptions: { controls: false } },
              }}
            />
          </div>
        )}
        {campaign.category && (
          <span className="campaign-badge">{campaign.category}</span>
        )}
      </div>

      <div className="campaign-body">
        {campaign.creator && (
          <div className="campaign-creator">
            {campaign.creator.avatar && (
              <img src={campaign.creator.avatar} alt={campaign.creator.name} className="creator-avatar" />
            )}
            <div className="creator-info">
              <p className="campaign-status">{campaign.status || "Crowdfunding"}</p>
              {campaign.creator.name && (
                <p className="creator-name">por {campaign.creator.name}</p>
              )}
            </div>
          </div>
        )}

        <h3 className="campaign-title">{campaign.title}</h3>

        {campaign.description && (
          <p className="campaign-description">{campaign.shortDescription}</p>
        )}

        <div className="campaign-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
          </div>
          <div className="campaign-stats">
            <div className="stat-item">
              <p className="stat-value">${(campaign.currentAmount || campaign.raised || 0).toLocaleString()}</p>
              <p className="stat-label">de ${(campaign.goal || 0).toLocaleString()} meta</p>
            </div>
            <div className="stat-item stat-right">
              <p className="stat-value stat-days">
                <FiCalendar className="icon-inline" />
                {daysLeft > 0 ? `${daysLeft} días` : "Finalizada"}
              </p>
              <p className="stat-label">{daysLeft > 0 ? "restantes" : ""}</p>
            </div>
          </div>

          {(campaign.backers || campaign.backers === 0) && (
            <div className="campaign-footer">
              <FiTrendingUp className="icon-small" />
              <span>{campaign.backers} patrocinadores</span>
              <span>•</span>
              <span>{progressPercentage.toFixed(0)}% financiado</span>
            </div>
          )}
        </div>
      </div>
      
      <style>{fullStyles}</style>
    </a>
  )
}

const compactStyles = `
  .campaign-card-compact {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    background: white;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    text-decoration: none;
    transition: all var(--transition-fast);
  }
  .campaign-card-compact:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary);
  }
  .campaign-compact-image {
    width: 5rem;
    height: 5rem;
    object-fit: cover;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }
  .campaign-compact-content {
    flex: 1;
    min-width: 0;
  }
  .campaign-compact-status {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }
  .campaign-compact-title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 0.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color var(--transition-fast);
  }
  .campaign-card-compact:hover .campaign-compact-title {
    color: var(--color-primary);
  }
  .campaign-compact-date {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
`

const fullStyles = `
  .campaign-card-full {
    display: block;
    background: white;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--color-border);
    text-decoration: none;
    transition: all var(--transition-base);
  }
  .campaign-card-full:hover {
    box-shadow: var(--shadow-xl);
    border-color: var(--color-primary);
  }
  .campaign-thumbnail {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: var(--color-muted);
  }
  .campaign-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
  .campaign-card-full:hover .campaign-image {
    transform: scale(1.05);
  }

  .campaign-video-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    opacity: 0;
    transition: opacity 0.4s ease;
    background: black;
    pointer-event: none;
  }
  .campaign-video-overlay.visible {
    opacity: 1;
  }

  .campaign-badge {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    padding: 0.375rem 0.875rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(4px);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-text-primary);
    z-index: 3;
  }
  .campaign-body {
    padding: 1.5rem;
  }
  .campaign-creator {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  .creator-avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
  }
  .creator-info {
    flex: 1;
    min-width: 0;
  }
  .campaign-status {
    font-size: var(--font-size-xs);
    color: var(--color-primary);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .creator-name {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-top: 0.125rem;
  }
  .campaign-title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 0.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color var(--transition-fast);
  }
  .campaign-card-full:hover .campaign-title {
    color: var(--color-primary);
  }
  .campaign-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-bottom: 1rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.5;
  }
  .campaign-progress {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .progress-bar {
    width: 100%;
    height: 0.5rem;
    background: var(--color-muted);
    border-radius: var(--radius-full);
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: var(--gradient-progress);
    border-radius: var(--radius-full);
    transition: width 0.5s ease;
  }
  .campaign-stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .stat-item {
    display: flex;
    flex-direction: column;
  }
  .stat-right {
    align-items: flex-end;
  }
  .stat-value {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 0.125rem;
  }
  .stat-days {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  .campaign-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  .icon-inline {
    width: 1rem;
    height: 1rem;
    color: var(--color-primary);
  }
  .icon-small {
    width: 0.875rem;
    height: 0.875rem;
  }
`

export default CampaignCard