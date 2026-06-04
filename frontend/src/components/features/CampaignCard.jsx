import { useState } from "react"
import { FiTrendingUp, FiUsers, FiClock, FiTag, FiMapPin } from "react-icons/fi"
import ReactPlayer from "react-player"
import { getCampaignPath } from "../../utils/campaignService"
import { getCampaignTimeLeft } from "$utils/datetime"

function stripMarkdown(text) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function CampaignCard({ campaign, variant = "standard", size = "default" }) {
  const goal = campaign.goal || campaign.targetAmount || 0
  const raised = campaign.currentAmount ?? campaign.raised ?? 0
  const progressPercentage = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0
  const timeLeft = getCampaignTimeLeft(campaign.endDate)
  const videoUrl = campaign.videoUrl || null
  const campaignPath = getCampaignPath(campaign)

  const [hovered, setHovered] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  const handleMouseEnter = () => {
    if (!videoUrl) return
    setHovered(true)
  }

  const handleMouseLeave = () => {
    setHovered(false)
  }

  if (variant === "compact") {
    return (
      <a href={campaignPath} className="campaign-card-compact">
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
            <p className="campaign-compact-meta">{progressPercentage.toFixed(0)}% — {timeLeft.ended ? "Finalizada" : timeLeft.short}</p>
          </div>
        </div>
        <style>{compactStyles}</style>
      </a>
    )
  }

  if (variant === "featured") {
    return (
      <a
        href={campaignPath}
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
                    ${raised.toLocaleString()}
                  </span>
                  <span className="editorial-stat-label">
                    de ${goal.toLocaleString()}
                  </span>
                </div>
                <div className="editorial-stat editorial-stat-right">
                  <span className="editorial-stat-value">
                    {progressPercentage.toFixed(0)}%
                  </span>
                  <span className="editorial-stat-label">
                    {timeLeft.ended ? "Finalizada" : timeLeft.text}
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

  if (variant === "horizontal") {
    const countdownClass =
      timeLeft.level === "urgent" || timeLeft.ended ? "countdown-urgent" :
      timeLeft.level === "warning" ? "countdown-warning" : ""

    return (
      <a href={campaignPath} className="campaign-card-horizontal">
        <div className="horizontal-image-wrap">
          <img
            src={campaign.imageUrl || campaign.image || "/crowdfunding-campaign.jpg"}
            alt={campaign.title}
            className="horizontal-image"
          />
          {campaign.category && (
            <span className="horizontal-badge">{campaign.category}</span>
          )}
        </div>

        <div className="horizontal-body">
          <div className="horizontal-content">
            {campaign.creator?.name && (
              <p className="horizontal-creator">por {campaign.creator.name}</p>
            )}
            <h3 className="horizontal-title">{campaign.title}</h3>

            <div className="horizontal-progress">
              <div className="horizontal-progress-bar">
                <div
                  className="horizontal-progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="horizontal-progress-label">
                ${raised.toLocaleString()} recaudados · {progressPercentage.toFixed(0)}% de la meta
              </p>
            </div>
          </div>

          <div className={`horizontal-countdown ${countdownClass}`}>
            <FiClock className="countdown-icon" />
            <span className="countdown-number">{timeLeft.ended ? "0" : timeLeft.value}</span>
            <span className="countdown-label">{timeLeft.ended ? "días" : timeLeft.unit}</span>
          </div>
        </div>

        <style>{horizontalStyles}</style>
      </a>
    )
  }

  const isLarge = size === "large"
  const longBlurb = isLarge
    ? stripMarkdown(campaign.description || campaign.shortDescription || "")
    : ""
  const ownerName = campaign.owner
    ? [campaign.owner.firstName, campaign.owner.lastName].filter(Boolean).join(" ").trim() || campaign.owner.userName
    : null

  return (
    <a
      href={campaignPath}
      className={`campaign-card-full ${isLarge ? "campaign-card-full--large" : ""}`}
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

          {isLarge && !campaign.creator && ownerName && (
            <p className="creator-name campaign-byline">por {ownerName}</p>
          )}

          <h3 className="campaign-title">{campaign.title}</h3>

          {isLarge && campaign.shortDescription && (
            <p className="campaign-tagline">{campaign.shortDescription}</p>
          )}

          {longBlurb && (
            <p className="campaign-description campaign-description--long">{longBlurb}</p>
          )}

          {!isLarge && campaign.description && (
            <p className="campaign-description">
              {campaign.shortDescription || campaign.description}
            </p>
          )}

          {isLarge && (campaign.category || campaign.country) && (
            <div className="campaign-tags">
              {campaign.category && (
                <span className="campaign-tag">
                  <FiTag className="campaign-tag-icon" />
                  {campaign.category}
                </span>
              )}
              {campaign.country && (
                <span className="campaign-tag">
                  <FiMapPin className="campaign-tag-icon" />
                  {campaign.country}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="campaign-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
          </div>
          <div className="campaign-stats">
            <div className="stat-item">
              <p className="stat-value">${raised.toLocaleString()}</p>
              <p className="stat-label">de ${goal.toLocaleString()} meta</p>
            </div>
            <div className="stat-item stat-right">
              <p className="stat-value">{timeLeft.ended ? "Finalizada" : timeLeft.text}</p>
              <p className="stat-label">{timeLeft.ended ? "" : "restantes"}</p>
            </div>
          </div>

          {campaign.backers != null && (
            <div className="campaign-footer">
              <FiTrendingUp className="icon-small" />
              <span>{campaign.backers} patrocinadores</span>
              <span>·</span>
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

const horizontalStyles = `
  .campaign-card-horizontal {
    display: flex;
    background: var(--color-background);
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--color-border);
    text-decoration: none;
    transition: all var(--transition-base);
    height: 8rem;
  }
  .campaign-card-horizontal:hover {
    box-shadow: var(--shadow-lg);
    border-color: var(--color-primary);
  }
  .horizontal-image-wrap {
    position: relative;
    width: 10rem;
    flex-shrink: 0;
    overflow: hidden;
  }
  .horizontal-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
  .campaign-card-horizontal:hover .horizontal-image {
    transform: scale(1.06);
  }
  .horizontal-badge {
    position: absolute;
    bottom: 0.5rem;
    left: 0.5rem;
    padding: 0.2rem 0.5rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(4px);
    border-radius: var(--radius-full);
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--color-text-primary);
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
  .horizontal-body {
    flex: 1;
    min-width: 0;
    padding: 0.875rem 1rem;
    display: flex;
    gap: 0.875rem;
    align-items: stretch;
  }
  .horizontal-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .horizontal-creator {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-bottom: 0.2rem;
  }
  .horizontal-title {
    font-size: var(--font-size-sm);
    font-weight: 700;
    color: var(--color-text-primary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.35;
    transition: color var(--transition-fast);
  }
  .campaign-card-horizontal:hover .horizontal-title {
    color: var(--color-primary);
  }
  .horizontal-progress {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .horizontal-progress-bar {
    width: 100%;
    height: 3px;
    background: var(--color-muted);
    border-radius: var(--radius-full);
    overflow: hidden;
  }
  .horizontal-progress-fill {
    height: 100%;
    background: var(--gradient-progress);
    border-radius: var(--radius-full);
  }
  .horizontal-progress-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .horizontal-countdown {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-left: 0.875rem;
    border-left: 1px solid var(--color-border);
    flex-shrink: 0;
    min-width: 3.75rem;
    gap: 0.1rem;
  }
  .countdown-icon {
    width: 0.875rem;
    height: 0.875rem;
    color: var(--color-text-muted);
    margin-bottom: 0.15rem;
  }
  .countdown-number {
    font-size: 1.75rem;
    font-weight: 800;
    line-height: 1;
    color: var(--color-text-primary);
    letter-spacing: -0.03em;
  }
  .countdown-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-align: center;
  }
  .countdown-warning .countdown-icon,
  .countdown-warning .countdown-number {
    color: #d97706;
  }
  .countdown-urgent .countdown-icon,
  .countdown-urgent .countdown-number {
    color: #dc2626;
  }
  .countdown-urgent {
    border-left-color: rgba(220, 38, 38, 0.2);
  }
  .countdown-warning {
    border-left-color: rgba(217, 119, 6, 0.2);
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
  .icon-small {
    width: 0.875rem;
    height: 0.875rem;
  }

  /* Large-size variant used in the FeaturedSection hero slot. Expanded copy
     + tag row so the card fills the available vertical space gracefully. */
  .campaign-card-full--large .campaign-body {
    padding: 1.75rem;
    gap: 1rem;
  }
  .campaign-card-full--large .campaign-main-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .campaign-card-full--large .campaign-title {
    font-size: 1.4rem;
    line-height: 1.25;
    margin-bottom: 0;
    -webkit-line-clamp: 3;
  }
  .campaign-card-full--large .campaign-byline {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .campaign-card-full--large .campaign-tagline {
    margin: 0;
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    font-weight: 500;
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .campaign-card-full--large .campaign-description--long {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    line-height: 1.55;
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .campaign-card-full--large .campaign-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }
  .campaign-card-full--large .campaign-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.7rem;
    border-radius: 9999px;
    background: var(--color-muted);
    color: var(--color-text-secondary);
    font-size: var(--font-size-xs);
    font-weight: 600;
  }
  .campaign-card-full--large .campaign-tag-icon {
    width: 0.85rem;
    height: 0.85rem;
    color: var(--color-primary);
  }
`

export default CampaignCard