import { useState, useRef } from "react"
import { FiCalendar, FiTrendingUp, FiUsers } from "react-icons/fi"
import ReactPlayer from "react-player"

function CampaignCard({ campaign, variant = "standard" }) {
  const goal = campaign.goal || campaign.targetAmount || 0
  const raised = campaign.currentAmount ?? campaign.raised ?? 0
  const progressPercentage = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0
  const daysLeft = campaign.daysLeft ?? 0
  const videoUrl = campaign.videoUrl || null

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

  if (variant === "compact") {
    return (
      <a href={`/campaigns/${campaign.id}`} className="campaign-card-compact">
        <img
          src={campaign.imageUrl || campaign.image || "/crowdfunding-campaign.jpg"}
          alt={campaign.title}
          className="campaign-compact-image"
        />
        <div className="campaign-compact-content">
          <p className="campaign-compact-status">
            {campaign.category || campaign.status || "Campaña"}
          </p>
          <h3 className="campaign-compact-title">{campaign.title}</h3>
          <div className="campaign-compact-progress">
            <div className="compact-progress-bar">
              <div className="compact-progress-fill" style={{ width: `${progressPercentage}%` }} />
            </div>
            <p className="campaign-compact-meta">{progressPercentage.toFixed(0)}% — {daysLeft > 0 ? `${daysLeft}d` : "Finalizada"}</p>
          </div>
        </div>
        <style>{compactStyles}</style>
      </a>
    )
  }

  if (variant === "featured") {
    return (
      <a
        href={`/campaigns/${campaign.id}`}
        className="campaign-card-editorial"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="editorial-media">
          <img
            src={campaign.imageUrl || campaign.image || "/crowdfunding-campaign.jpg"}
            alt={campaign.title}
            className="editorial-image"
          />
          {videoUrl && (
            <div className={`editorial-video ${hovered && videoReady ? "visible" : ""}`}>
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
          <div className="editorial-gradient" />
        </div>

        <div className="editorial-overlay">
          <div className="editorial-top">
            {campaign.category && (
              <span className="editorial-badge">{campaign.category}</span>
            )}
            {campaign.creator?.name && (
              <span className="editorial-creator">por {campaign.creator.name}</span>
            )}
          </div>

          <div className="editorial-bottom">
            <h3 className="editorial-title">{campaign.title}</h3>
            {campaign.description && (
              <p className="editorial-description">
                {campaign.shortDescription || campaign.description}
              </p>
            )}

            <div className="editorial-progress">
              <div className="editorial-progress-bar">
                <div
                  className="editorial-progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="editorial-stats">
                <div className="editorial-stat">
                  <span className="editorial-stat-value">
                    ${(raised).toLocaleString()}
                  </span>
                  <span className="editorial-stat-label">
                    de ${(goal).toLocaleString()}
                  </span>
                </div>
                <div className="editorial-stat editorial-stat-right">
                  <span className="editorial-stat-value">
                    {progressPercentage.toFixed(0)}%
                  </span>
                  <span className="editorial-stat-label">
                    {daysLeft > 0 ? `${daysLeft} días` : "Finalizada"}
                  </span>
                </div>
              </div>
            </div>

            {campaign.backers != null && (
              <div className="editorial-footer">
                <FiUsers className="editorial-footer-icon" />
                <span>{campaign.backers} patrocinadores</span>
              </div>
            )}
          </div>
        </div>

        <style>{editorialStyles}</style>
      </a>
    )
  }

  return (
    <a
      href={`/campaigns/${campaign.id}`}
      className="campaign-card-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="campaign-thumbnail">
        <img
          src={campaign.imageUrl || campaign.image || "/crowdfunding-campaign.jpg"}
          alt={campaign.title}
          className="campaign-image"
        />
        {videoUrl && (
          <div className={`campaign-video-overlay ${hovered && videoReady ? "visible" : ""}`}>
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
        <div className="campaign-main-content">
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
            <p className="campaign-description">
              {campaign.shortDescription || campaign.description}
            </p>
          )}
        </div>

        <div className="campaign-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
          </div>
          <div className="campaign-stats">
            <div className="stat-item">
              <p className="stat-value">${(raised).toLocaleString()}</p>
              <p className="stat-label">de ${(goal).toLocaleString()} meta</p>
            </div>
            <div className="stat-item stat-right">
              <p className="stat-value stat-days">
                <FiCalendar className="icon-inline" />
                {daysLeft > 0 ? `${daysLeft} días` : "Finalizada"}
              </p>
              <p className="stat-label">{daysLeft > 0 ? "restantes" : ""}</p>
            </div>
          </div>

          {campaign.backers != null && (
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
    background: var(--color-background);
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
    width: 4.5rem;
    height: 4.5rem;
    object-fit: cover;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }
  .campaign-compact-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .campaign-compact-status {
    font-size: var(--font-size-xs);
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
  }
  .campaign-compact-title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-primary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color var(--transition-fast);
    line-height: 1.35;
  }
  .campaign-card-compact:hover .campaign-compact-title {
    color: var(--color-primary);
  }
  .campaign-compact-progress {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .compact-progress-bar {
    width: 100%;
    height: 3px;
    background: var(--color-muted);
    border-radius: var(--radius-full);
    overflow: hidden;
  }
  .compact-progress-fill {
    height: 100%;
    background: var(--gradient-progress);
    border-radius: var(--radius-full);
  }
  .campaign-compact-meta {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
`

const editorialStyles = `
  .campaign-card-editorial {
    position: relative;
    display: block;
    border-radius: var(--radius-lg);
    overflow: hidden;
    text-decoration: none;
    height: 100%;
    min-height: 420px;
    background: #111;
    transition: box-shadow 0.3s ease;
  }
  .campaign-card-editorial:hover {
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.28);
  }
  .editorial-media {
    position: absolute;
    inset: 0;
  }
  .editorial-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s ease, opacity 0.4s ease;
    opacity: 0.9;
  }
  .campaign-card-editorial:hover .editorial-image {
    transform: scale(1.04);
    opacity: 0.75;
  }
  .editorial-video {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.4s ease;
    background: black;
    pointer-events: none;
  }
  .editorial-video.visible {
    opacity: 1;
  }
  .editorial-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.88) 0%,
      rgba(0, 0, 0, 0.5) 40%,
      rgba(0, 0, 0, 0.15) 70%,
      transparent 100%
    );
    transition: opacity 0.3s ease;
  }
  .campaign-card-editorial:hover .editorial-gradient {
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.92) 0%,
      rgba(0, 0, 0, 0.6) 45%,
      rgba(0, 0, 0, 0.2) 75%,
      transparent 100%
    );
  }
  .editorial-overlay {
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 1.25rem;
  }
  .editorial-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .editorial-badge {
    padding: 0.3rem 0.75rem;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .editorial-creator {
    font-size: var(--font-size-xs);
    color: rgba(255, 255, 255, 0.65);
  }
  .editorial-bottom {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }
  .editorial-title {
    font-size: 1.6rem;
    font-weight: 800;
    color: #fff;
    line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.2s ease;
    letter-spacing: -0.02em;
  }
  .campaign-card-editorial:hover .editorial-title {
    color: rgba(255, 255, 255, 0.9);
  }
  .editorial-description {
    font-size: var(--font-size-sm);
    color: rgba(255, 255, 255, 0.65);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.5;
    margin: 0;
  }
  .editorial-progress {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .editorial-progress-bar {
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-full);
    overflow: hidden;
  }
  .editorial-progress-fill {
    height: 100%;
    background: var(--gradient-progress, linear-gradient(90deg, var(--color-primary), var(--color-secondary)));
    border-radius: var(--radius-full);
    transition: width 0.5s ease;
  }
  .editorial-stats {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .editorial-stat {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  .editorial-stat-right {
    align-items: flex-end;
  }
  .editorial-stat-value {
    font-size: var(--font-size-base);
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }
  .editorial-stat-label {
    font-size: var(--font-size-xs);
    color: rgba(255, 255, 255, 0.55);
  }
  .editorial-footer {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--font-size-xs);
    color: rgba(255, 255, 255, 0.5);
    padding-top: 0.625rem;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }
  .editorial-footer-icon {
    width: 0.875rem;
    height: 0.875rem;
  }
`

const fullStyles = `
  .campaign-card-full {
    display: flex;
    flex-direction: column;
    background: var(--color-background);
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--color-border);
    text-decoration: none;
    transition: all var(--transition-base);
    height: 100%;
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
    flex-shrink: 0;
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
    pointer-events: none;
  }
  .campaign-video-overlay.visible {
    opacity: 1;
  }
  .campaign-badge {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    padding: 0.3rem 0.75rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(4px);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-text-primary);
    z-index: 3;
  }
  .campaign-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex-grow: 1;
  }
  .campaign-main-content {
    display: flex;
    flex-direction: column;
  }
  .campaign-creator {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.625rem;
  }
  .creator-avatar {
    width: 1.75rem;
    height: 1.75rem;
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
    margin-top: 0.1rem;
  }
  .campaign-title {
    font-size: var(--font-size-base);
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 0.375rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color var(--transition-fast);
    line-height: 1.3;
  }
  .campaign-card-full:hover .campaign-title {
    color: var(--color-primary);
  }
  .campaign-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin-bottom: 0.875rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.5;
  }
  .campaign-progress {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    margin-top: auto;
  }
  .progress-bar {
    width: 100%;
    height: 4px;
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
    font-size: var(--font-size-sm);
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 0.1rem;
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
    gap: 0.4rem;
    padding-top: 0.625rem;
    border-top: 1px solid var(--color-border);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
  .icon-inline {
    width: 0.875rem;
    height: 0.875rem;
    color: var(--color-primary);
  }
  .icon-small {
    width: 0.875rem;
    height: 0.875rem;
  }
`

export default CampaignCard