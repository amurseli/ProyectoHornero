import { Clock, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCampaignPath } from '$utils/campaignService'
import './CampaignWideCard.css'

function CampaignWideCard({
  campaign,
  to,
  statusLabel = null,
  description = null,
  showStatusBadge = true,
  className = '',
}) {
  const goal = Number(campaign.goal || campaign.targetAmount || 0)
  const raised = Number(campaign.raised ?? campaign.currentAmount ?? 0)
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0
  const href = to || getCampaignPath(campaign)
  const daysLabel = campaign.daysLeft > 0 ? `${campaign.daysLeft} días restantes` : 'Finalizada'

  return (
    <Link to={href} className={`cwc-card ${className}`.trim()}>
      <div className="cwc-image-wrap">
        <img src={campaign.imageUrl} alt={campaign.title} className="cwc-image" />
        {showStatusBadge && statusLabel && (
          <span className="cwc-status-badge">{statusLabel}</span>
        )}
      </div>

      <div className="cwc-body">
        <span className="cwc-category">{campaign.category}</span>
        <h2 className="cwc-title">{campaign.title}</h2>
        {description && <p className="cwc-description">{description}</p>}

        <div className="cwc-progress">
          <div className="cwc-progress-bar">
            <div className="cwc-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="cwc-progress-labels">
            <span>${raised.toLocaleString('es-AR')} recaudados</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
        </div>

        <div className="cwc-stats">
          <div className="cwc-stat">
            <TrendingUp size={16} />
            <span>Meta: ${goal.toLocaleString('es-AR')}</span>
          </div>
          <div className="cwc-stat">
            <Users size={16} />
            <span>{(campaign.backers ?? 0).toLocaleString('es-AR')} aportantes</span>
          </div>
          <div className="cwc-stat">
            <Clock size={16} />
            <span>{daysLabel}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default CampaignWideCard
