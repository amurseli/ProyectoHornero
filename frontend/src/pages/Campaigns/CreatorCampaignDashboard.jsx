import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BarChart3, FilePenLine, Clock3, Target, Users } from 'lucide-react'
import { Button } from '$components/ui'
import api from '$utils/api/api'
import EditDraftCampaign from './EditDraftCampaign'
import './CreatorCampaignDashboard.css'

function formatMoney(amount) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount || 0)
}

function formatDate(value) {
  if (!value) return 'N/D'
  return new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getDaysLeft(endDate) {
  if (!endDate) return null
  return Math.max(0, Math.ceil((new Date(endDate) - new Date()) / 86400000))
}

function StatisticsSection({ detail, rewards }) {
  const campaign = detail?.campaign
  const rewardMap = useMemo(() => new Map((rewards || []).map(reward => [reward.id, reward])), [rewards])
  const contributorRows = useMemo(() => {
    const byUser = new Map()

    for (const contribution of detail?.contributions || []) {
      const key = contribution.contributorUserId || contribution.contributorEmail || contribution.contributionId
      const current = byUser.get(key) || {
        key,
        contributorName: contribution.contributorName || 'N/D',
        contributorEmail: contribution.contributorEmail || 'N/D',
        approvedAmount: 0,
        latestApprovedAt: null,
        latestContributionAt: contribution.createdAt || null,
        currentRewardId: null,
        currentRewardPrice: null,
        hasPending: false,
        hasRejected: false,
      }

      const createdAt = contribution.createdAt ? new Date(contribution.createdAt) : null
      const isApproved = contribution.status === 'APPROVED'

      if (isApproved) {
        current.approvedAmount += Number(contribution.amount || 0)
        if (!current.latestApprovedAt || (createdAt && createdAt > current.latestApprovedAt)) {
          current.latestApprovedAt = createdAt
        }
        if (contribution.rewardId) {
          current.currentRewardId = contribution.rewardId
          current.currentRewardPrice = contribution.rewardPrice
        }
      } else if (contribution.status === 'PENDING' || contribution.status === 'IN_PROCESS') {
        current.hasPending = true
      } else if (contribution.status === 'REJECTED' || contribution.status === 'CANCELLED') {
        current.hasRejected = true
      }

      if (!current.latestContributionAt || (createdAt && createdAt > new Date(current.latestContributionAt))) {
        current.latestContributionAt = contribution.createdAt || current.latestContributionAt
      }

      byUser.set(key, current)
    }

    return Array.from(byUser.values())
      .map((row) => ({
        ...row,
        rewardLabel: row.currentRewardId
          ? (rewardMap.get(row.currentRewardId)?.title || formatMoney(row.currentRewardPrice))
          : 'Sin recompensa activada',
        statusLabel: row.approvedAmount > 0
          ? 'APPROVED'
          : row.hasPending
            ? 'PENDING'
            : row.hasRejected
              ? 'REJECTED'
              : 'N/D',
      }))
      .sort((a, b) => {
        if (b.approvedAmount !== a.approvedAmount) return b.approvedAmount - a.approvedAmount
        return new Date(b.latestContributionAt || 0) - new Date(a.latestContributionAt || 0)
      })
  }, [detail?.contributions, rewardMap])

  if (!campaign) return null

  const currentAmount = Number(campaign.currentAmount || 0)
  const targetAmount = Number(campaign.targetAmount || 0)
  const progress = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0
  const daysLeft = getDaysLeft(campaign.endDate)
  const uniqueApprovedContributors = contributorRows.filter((row) => row.approvedAmount > 0).length

  return (
    <section className="ccd-section">
      <div className="ccd-stats-grid">
        <article className="ccd-stat-card">
          <div className="ccd-stat-icon"><Target size={18} /></div>
          <span className="ccd-stat-label">Objetivo alcanzado</span>
          <strong className="ccd-stat-value">{progress.toFixed(0)}%</strong>
          <span className="ccd-stat-helper">{formatMoney(currentAmount)} de {formatMoney(targetAmount)}</span>
        </article>
        <article className="ccd-stat-card">
          <div className="ccd-stat-icon"><Clock3 size={18} /></div>
          <span className="ccd-stat-label">Tiempo restante</span>
          <strong className="ccd-stat-value">{daysLeft === null ? 'N/D' : daysLeft}</strong>
          <span className="ccd-stat-helper">{daysLeft === 0 ? 'Campaña finalizada' : `Cierra el ${formatDate(campaign.endDate)}`}</span>
        </article>
        <article className="ccd-stat-card">
          <div className="ccd-stat-icon"><Users size={18} /></div>
          <span className="ccd-stat-label">Aportantes</span>
          <strong className="ccd-stat-value">{uniqueApprovedContributors}</strong>
          <span className="ccd-stat-helper">{formatMoney(detail.approvedAmount || 0)} aprobados</span>
        </article>
      </div>

      <div className="ccd-table-card">
        <div className="ccd-table-header">
          <div>
            <h2 className="ccd-block-title">Aportantes y recompensas</h2>
            <p className="ccd-block-subtitle">Listado de contribuciones para saber qué recompensa corresponde a cada persona.</p>
          </div>
        </div>

        {contributorRows.length ? (
          <div className="ccd-table-wrap">
            <table className="ccd-table">
              <thead>
                <tr>
                  <th>Aportante</th>
                  <th>Email</th>
                  <th>Total aprobado</th>
                  <th>Recompensa</th>
                  <th>Estado</th>
                  <th>Último aporte</th>
                </tr>
              </thead>
              <tbody>
                {contributorRows.map((contributor) => (
                  <tr key={contributor.key}>
                    <td>{contributor.contributorName}</td>
                    <td>{contributor.contributorEmail}</td>
                    <td>{formatMoney(contributor.approvedAmount)}</td>
                    <td>{contributor.rewardLabel}</td>
                    <td>
                      <span className={`ccd-pill ccd-pill--${String(contributor.statusLabel || '').toLowerCase()}`}>
                        {contributor.statusLabel}
                      </span>
                    </td>
                    <td>{formatDate(contributor.latestContributionAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="ccd-empty">Todavía no hay aportes registrados para esta campaña.</p>
        )}
      </div>
    </section>
  )
}

export default function CreatorCampaignDashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const mainRef = useRef(null)
  const [campaign, setCampaign] = useState(null)
  const [rewards, setRewards] = useState([])
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState('campaign')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/api/campaigns/${id}`),
      api.get(`/api/campaigns/${id}/rewards`).catch(() => []),
      api.get(`/api/creator/campaigns/${id}/details`),
    ])
      .then(([campaignData, rewardsData, detailData]) => {
        setCampaign(campaignData)
        setRewards(Array.isArray(rewardsData) ? rewardsData : [])
        setDetail(detailData)
      })
      .catch(err => setError(err.message || 'No se pudo cargar la campaña'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSectionChange = (section) => {
    setActiveSection(section)

    requestAnimationFrame(() => {
      const top = mainRef.current
        ? mainRef.current.getBoundingClientRect().top + window.scrollY - 96
        : 0
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    })
  }

  if (loading) {
    return (
      <div className="ccd-page">
        <div className="ccd-loading">
          <div className="ccd-spinner" />
          <p>Cargando panel de campaña...</p>
        </div>
      </div>
    )
  }

  if (error || !campaign || !detail) {
    return (
      <div className="ccd-page">
        <div className="ccd-error">
          <h2>No se pudo cargar la campaña</h2>
          <p>{error || 'La campaña no existe o no tenés acceso.'}</p>
          <Button variant="secondary" onClick={() => navigate('/my-campaigns')}>
            <ArrowLeft size={16} /> Volver a mis campañas
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="ccd-page">
      <button className="ccd-back" onClick={() => navigate('/my-campaigns')}>
        <ArrowLeft size={16} /> Mis campañas
      </button>

      <div className="ccd-shell">
        <aside className="ccd-sidebar">
          <div className="ccd-campaign-card">
            <span className="ccd-kicker">Panel de campaña</span>
            <h1>{campaign.title || 'Campaña sin título'}</h1>
            <p>{campaign.shortDescription || 'Gestioná la campaña y revisá sus aportes.'}</p>
          </div>

          <nav className="ccd-nav">
            <button
              className={`ccd-nav-item ${activeSection === 'campaign' ? 'is-active' : ''}`}
              onClick={() => handleSectionChange('campaign')}
            >
              <FilePenLine size={16} /> Mi campaña
            </button>
            <button
              className={`ccd-nav-item ${activeSection === 'stats' ? 'is-active' : ''}`}
              onClick={() => handleSectionChange('stats')}
            >
              <BarChart3 size={16} /> Estadísticas
            </button>
          </nav>
        </aside>

        <main className="ccd-main" ref={mainRef}>
          {activeSection === 'campaign' ? (
            <section className="ccd-section">
              <div className="ccd-panel-header">
                <div>
                  <h2 className="ccd-block-title">Mi campaña</h2>
                  <p className="ccd-block-subtitle">Editá la campaña desde el mismo formulario que usabas hasta ahora.</p>
                </div>
              </div>
              <EditDraftCampaign campaignId={id} embedded />
            </section>
          ) : (
            <StatisticsSection detail={detail} rewards={rewards} />
          )}
        </main>
      </div>
    </div>
  )
}
