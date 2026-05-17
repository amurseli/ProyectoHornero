import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { campaignService } from '$utils/campaignService'
import { Button } from '$components/ui'
import ContributionModal from '$components/ContributionModal/ContributionModal'
import { useUser } from '../../store/useUser'
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Bookmark, Share2, Clock, Users, MapPin, Tag } from 'lucide-react'
import './CampaignPage.css'

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

function getProgress(current, goal) {
  if (!goal || goal <= 0) return 0
  return Math.min(100, Math.round((current / goal) * 100))
}

/* ─── Hero: media carousel + stats panel ─── */

function CampaignHero({ campaign, onContribute, contributeDisabledReason }) {
  const [mediaIndex, setMediaIndex] = useState(0)
  const progress = getProgress(campaign.currentAmount, campaign.goal)

  const mediaItems = []
  if (campaign.videoUrl) mediaItems.push({ type: 'video', url: campaign.videoUrl })
  if (campaign.imageUrl) mediaItems.push({ type: 'image', url: campaign.imageUrl })
  if (campaign.media?.length) {
    campaign.media.forEach(m => {
      const url = m.base64Data ? `data:image/jpeg;base64,${m.base64Data}` : m.url
      if (url && !mediaItems.find(i => i.url === url)) mediaItems.push({ type: m.mediaType === 'VIDEO' ? 'video' : 'image', url })
    })
  }
  if (mediaItems.length === 0) mediaItems.push({ type: 'image', url: '/crowdfunding-campaign.jpg' })

  const prev = () => setMediaIndex(i => (i - 1 + mediaItems.length) % mediaItems.length)
  const next = () => setMediaIndex(i => (i + 1) % mediaItems.length)
  const current = mediaItems[mediaIndex]

  return (
    <section className="cp-hero">
      <div className="cp-hero-header">
        <h1 className="cp-title">{campaign.title}</h1>
        <p className="cp-subtitle">{campaign.shortDescription || campaign.description}</p>
        <div className="cp-tags">
          {campaign.category && (
            <span className="cp-tag cp-tag--cat"><Tag size={12} /> {campaign.category}</span>
          )}
          {campaign.creator?.name && (
            <span className="cp-tag"><Users size={12} /> {campaign.creator.name}</span>
          )}
        </div>
      </div>

      <div className="cp-hero-grid">
        {/* Media */}
        <div className="cp-media">
          {current.type === 'image' ? (
            <img src={current.url} alt={campaign.title} className="cp-media-img" />
          ) : (
            <div className="cp-media-video">
              <img src={campaign.imageUrl || '/crowdfunding-campaign.jpg'} alt={campaign.title} className="cp-media-img" />
              <div className="cp-play-btn"><Play size={24} /></div>
            </div>
          )}
          {mediaItems.length > 1 && (
            <>
              <button className="cp-carousel-arrow cp-carousel-arrow--left" onClick={prev}><ChevronLeft size={18} /></button>
              <button className="cp-carousel-arrow cp-carousel-arrow--right" onClick={next}><ChevronRight size={18} /></button>
              <div className="cp-carousel-dots">
                {mediaItems.map((_, i) => (
                  <span key={i} className={`cp-dot ${i === mediaIndex ? 'active' : ''}`} onClick={() => setMediaIndex(i)} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Stats panel */}
        <div className="cp-stats-panel">
          <div className="cp-progress">
            <div className="cp-progress-bar">
              <div className="cp-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="cp-amount">{formatCurrency(campaign.currentAmount || 0)}</div>
          <div className="cp-amount-label">contribuido de {formatCurrency(campaign.goal)}</div>

          <div className="cp-stats-row">
            <div className="cp-stat">
              <span className="cp-stat-value">{(campaign.backers || 0).toLocaleString()}</span>
              <span className="cp-stat-label">patrocinadores</span>
            </div>
            <div className="cp-stat">
              <span className="cp-stat-value">{campaign.daysLeft ?? '—'}</span>
              <span className="cp-stat-label">días restantes</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="cp-cta"
            onClick={() => onContribute()}
            disabled={!!contributeDisabledReason}
            title={contributeDisabledReason || undefined}
          >
            Patrocinar este proyecto
          </Button>
          {contributeDisabledReason && (
            <p className="cp-disabled-note">{contributeDisabledReason}</p>
          )}

          <div className="cp-secondary-actions">
            <button className="cp-sec-btn"><Bookmark size={14} /> Recordarme</button>
            <button className="cp-sec-btn"><Share2 size={14} /> Compartir</button>
          </div>

          <p className="cp-funding-note">
            <strong>Todo o nada.</strong> Este proyecto solo se financia si alcanza la meta antes de la fecha límite.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ─── Tabs ─── */

const TABS = [
  { key: 'campaign', label: 'Campaña' },
  { key: 'rewards', label: 'Recompensas' },
  { key: 'creator', label: 'Creador' },
  { key: 'faq', label: 'FAQ' },
  { key: 'updates', label: 'Actualizaciones' },
  { key: 'comments', label: 'Comentarios' },
]

function CampaignTabs({ active, onChange }) {
  return (
    <nav className="cp-tabs">
      {TABS.map(tab => (
        <button
          key={tab.key}
          className={`cp-tab ${active === tab.key ? 'active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

/* ─── Content: TOC + main + sidebar ─── */

const TOC_ITEMS = [
  'Historia del proyecto',
  'Stretch Goals',
  'Cómo funciona',
  'Riesgos y desafíos',
]

function CampaignContent({ campaign, activeTab, onContribute, contributeDisabledReason }) {
  const [activeToc, setActiveToc] = useState(0)
  const [sidebarAmount, setSidebarAmount] = useState(1)

  if (activeTab === 'rewards') {
    return (
      <div className="cp-content-grid">
        <div className="cp-main cp-main--full">
          <h2>Recompensas disponibles</h2>
          <p className="cp-placeholder-text">Las recompensas de esta campaña se mostrarán aquí.</p>
        </div>
      </div>
    )
  }

  if (activeTab === 'creator') {
    return (
      <div className="cp-content-grid">
        <div className="cp-main cp-main--full">
          <h2>Sobre el creador</h2>
          <div className="cp-creator-detail">
            {campaign.creator?.avatar && (
              <img src={campaign.creator.avatar} alt="" className="cp-creator-avatar-lg" />
            )}
            <div>
              <h3>{campaign.creator?.name || 'Creador'}</h3>
              <p className="cp-placeholder-text">Información del creador de esta campaña.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (['faq', 'updates', 'comments'].includes(activeTab)) {
    const labels = { faq: 'Preguntas frecuentes', updates: 'Actualizaciones', comments: 'Comentarios' }
    return (
      <div className="cp-content-grid">
        <div className="cp-main cp-main--full">
          <h2>{labels[activeTab]}</h2>
          <p className="cp-placeholder-text">Esta sección estará disponible próximamente.</p>
        </div>
      </div>
    )
  }

  // Tab "campaign" (default)
  return (
    <div className="cp-content-grid">
      {/* TOC */}
      <aside className="cp-toc">
        <span className="cp-toc-title">Contenido</span>
        {TOC_ITEMS.map((item, i) => (
          <button
            key={i}
            className={`cp-toc-link ${activeToc === i ? 'active' : ''}`}
            onClick={() => setActiveToc(i)}
          >
            {item}
          </button>
        ))}
      </aside>

      {/* Main content */}
      <div className="cp-main">
        <h2>Historia del proyecto</h2>
        <div className="cp-content-image">
          {campaign.imageUrl && <img src={campaign.imageUrl} alt="" />}
        </div>
        <p>{campaign.description || 'Descripción detallada de la campaña.'}</p>

        <h2>Stretch Goals</h2>
        <p className="cp-placeholder-text">Los stretch goals se irán desbloqueando a medida que se alcancen las metas.</p>

        <h2>Cómo funciona</h2>
        <p className="cp-placeholder-text">Información sobre el funcionamiento del proyecto y su desarrollo.</p>

        <h2>Riesgos y desafíos</h2>
        <p className="cp-placeholder-text">Transparencia sobre los riesgos identificados y las estrategias de mitigación.</p>
      </div>

      {/* Sidebar */}
      <aside className="cp-sidebar">
        <div className="cp-creator-card">
          {campaign.creator?.avatar ? (
            <img src={campaign.creator.avatar} alt="" className="cp-creator-avatar" />
          ) : (
            <div className="cp-creator-avatar cp-creator-avatar--placeholder">
              {(campaign.creator?.name || 'C')[0]}
            </div>
          )}
          <span className="cp-creator-name">{campaign.creator?.name || 'Creador'}</span>
          <span className="cp-creator-meta">Creador del proyecto</span>
        </div>

        <div className="cp-contribute-card">
          <span className="cp-contribute-title">Contribuir sin recompensa</span>
          <p className="cp-contribute-desc">Apoyá el proyecto simplemente porque te parece interesante.</p>
          <div className="cp-amount-input">
            <span className="cp-amount-prefix">ARS $</span>
            <input
              type="number"
              value={sidebarAmount}
              onChange={(e) => setSidebarAmount(Number(e.target.value))}
              min={1}
              className="cp-amount-field"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            className="cp-contribute-btn"
            onClick={() => onContribute(sidebarAmount)}
            disabled={!!contributeDisabledReason}
            title={contributeDisabledReason || undefined}
          >
            Aportar
          </Button>
        </div>
      </aside>
    </div>
  )
}

/* ─── Page (orquestador) ─── */

export default function CampaignPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('campaign')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAmount, setModalAmount] = useState(1)

  function openModal(amount = 1) {
    setModalAmount(amount)
    setModalOpen(true)
  }

  function getContributeDisabledReason(c) {
    if (!c) return null
    if (c.status === 'DRAFT') return 'Esta campaña aún no fue publicada'
    if (user && c.owner?.id === user.userId) return 'No podés patrocinar tu propia campaña'
    return null
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    campaignService.getCampaignById(id)
      .then(data => {
        if (!data) throw new Error('Campaña no encontrada')
        setCampaign(data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="cp-page">
        <div className="cp-loading">
          <div className="cp-spinner" />
          <p>Cargando campaña...</p>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="cp-page">
        <div className="cp-error">
          <h2>Campaña no encontrada</h2>
          <p>{error || 'La campaña que buscás no existe o fue eliminada.'}</p>
          <Button variant="secondary" onClick={() => navigate('/campaigns')}>
            <ArrowLeft size={16} /> Volver a campañas
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="cp-page">
      <div className="cp-container">
        <button className="cp-back" onClick={() => navigate('/campaigns')}>
          <ArrowLeft size={16} /> Campañas
        </button>

        {(() => {
          const contributeDisabledReason = getContributeDisabledReason(campaign)
          return (
            <>
              <CampaignHero
                campaign={campaign}
                onContribute={openModal}
                contributeDisabledReason={contributeDisabledReason}
              />
              <CampaignTabs active={activeTab} onChange={setActiveTab} />
              <CampaignContent
                campaign={campaign}
                activeTab={activeTab}
                onContribute={openModal}
                contributeDisabledReason={contributeDisabledReason}
              />
            </>
          )
        })()}
        {modalOpen && (
          <ContributionModal
            campaignId={Number(id)}
            initialAmount={modalAmount}
            onClose={() => setModalOpen(false)}
          />
        )}
      </div>
    </div>
  )
}