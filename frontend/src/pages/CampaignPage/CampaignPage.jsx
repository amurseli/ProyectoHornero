import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { campaignService } from '$utils/campaignService'
import { Button } from '$components/ui'
import ContributionModal from '$components/ContributionModal/ContributionModal'
import api from '$utils/api/api'
import { useUser } from '../../store/useUser'
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Bookmark, Share2, Users, Tag, Gift, X } from 'lucide-react'
import './CampaignPage.css'

const PUBLIC_DESC_LIMIT = 100

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount)
}

function getProgress(current, goal) {
  if (!goal || goal <= 0) return 0
  return Math.min(100, Math.round((current / goal) * 100))
}

function normalizeRewards(rewards) {
  return [...(Array.isArray(rewards) ? rewards : [])].sort(
    (a, b) => Number(a.price ?? 0) - Number(b.price ?? 0) || (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  )
}

function getDescriptionPreview(text, limit = PUBLIC_DESC_LIMIT) {
  const normalized = String(text || '').trim()
  if (!normalized) return { text: '', truncated: false }
  if (normalized.length <= limit) return { text: normalized, truncated: false }
  return { text: `${normalized.slice(0, limit).trimEnd()}...`, truncated: true }
}

function DescriptionPreview({ text }) {
  const preview = getDescriptionPreview(text)
  if (!preview.text) return null

  return <p className={`cp-description-text ${preview.truncated ? 'cp-description-text--truncated' : ''}`}>{preview.text}</p>
}

function DetailOverlay({ item, onClose, onContribute, disabledReason }) {
  useEffect(() => {
    if (!item) return undefined

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [item, onClose])

  if (!item) return null

  const imageSrc = item.imageBase64 ? `data:image/jpeg;base64,${item.imageBase64}` : null
  const isReward = item.kind === 'reward'

  return (
    <div className="cp-focus-overlay" onClick={onClose}>
      <div
        className={`cp-focus-card ${isReward ? 'cp-focus-card--reward' : ''} ${imageSrc ? '' : 'cp-focus-card--no-media'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="cp-focus-close" onClick={onClose} aria-label="Cerrar detalle">
          <X size={18} />
        </button>

        {imageSrc && (
          <div className="cp-focus-media">
            <img src={imageSrc} alt={item.title} className="cp-focus-image" />
          </div>
        )}

        <div className="cp-focus-body">
          {isReward ? (
            <div className="cp-focus-kicker">{formatCurrency(item.price || 0)}</div>
          ) : (
            item.role && <div className="cp-focus-kicker">{item.role}</div>
          )}
          <h3 className="cp-focus-title">{item.title}</h3>
          <p className="cp-focus-description">{item.description}</p>

          {isReward && (
            <>
              <Button
                variant="primary"
                className="cp-focus-action"
                onClick={() => onContribute(Number(item.price) || 1)}
                disabled={!!disabledReason}
                title={disabledReason || undefined}
              >
                Elegir {formatCurrency(item.price || 0)}
              </Button>
              {disabledReason && <p className="cp-reward-disabled">{disabledReason}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function RewardTierCard({ reward, onContribute, onOpenCard, compact = false, disabledReason = null }) {
  const imageSrc = reward.imageBase64 ? `data:image/jpeg;base64,${reward.imageBase64}` : null

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpenCard?.(reward)
    }
  }

  return (
    <article
      className={`cp-reward-card ${compact ? 'cp-reward-card--compact' : ''}`}
      onClick={() => onOpenCard?.(reward)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {imageSrc && (
        <div className="cp-reward-image-wrap">
          <img src={imageSrc} alt={reward.title} className="cp-reward-image" />
        </div>
      )}
      <div className="cp-reward-body">
        <div className="cp-reward-copy">
          <div className="cp-reward-price">{formatCurrency(reward.price || 0)}</div>
          <h3 className="cp-reward-title">{reward.title}</h3>
          <DescriptionPreview text={reward.description} />
        </div>
        <Button
          variant="primary"
          size={compact ? 'sm' : 'md'}
          className="cp-reward-btn"
          onClick={(event) => {
            event.stopPropagation()
            onContribute(Number(reward.price) || 1)
          }}
          disabled={!!disabledReason}
          title={disabledReason || undefined}
        >
          Elegir {formatCurrency(reward.price || 0)}
        </Button>
        {disabledReason && <p className="cp-reward-disabled">{disabledReason}</p>}
      </div>
    </article>
  )
}

/* ─── Hero: media carousel + stats panel ─── */

function toEmbedUrl(url) {
  if (!url) return null
  // YouTube short / watch / shorts / embed URLs
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`
  // Vimeo
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1`
  return null
}

function CampaignHero({ campaign, onContribute, contributeDisabledReason }) {
  // ─── Build the media manifest ────────────────────────────────────────
  // 1. The video (if any) is shown first, with the primary image as poster.
  // 2. After the video comes a carousel of the *other* images (max 6).
  // 3. Falls back to a placeholder when there's no media at all.

  const rawMedia = Array.isArray(campaign.media) ? campaign.media : []
  const sortedMedia = [...rawMedia].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))

  const videoEntry = sortedMedia.find(m => m.mediaType === 'VIDEO')
  const videoUrl = videoEntry?.url || campaign.videoUrl || null
  const embedUrl = toEmbedUrl(videoUrl)

  const allImages = sortedMedia.filter(m => m.mediaType === 'IMAGE')
  const primary = allImages.find(m => m.isPrimary) || allImages[0]
  const primaryUrl = primary
    ? (primary.base64Data ? `data:image/jpeg;base64,${primary.base64Data}` : primary.url)
    : (campaign.imageUrl || '/crowdfunding-campaign.jpg')
  const galleryImages = allImages
    .filter(m => m !== primary)
    .map(m => (m.base64Data ? `data:image/jpeg;base64,${m.base64Data}` : m.url))
    .filter(Boolean)
    .slice(0, 6)

  // mediaItems[0] = video (or primary image if no video), the rest = gallery.
  const mediaItems = []
  if (videoUrl) {
    mediaItems.push({ type: 'video', url: videoUrl, embedUrl, poster: primaryUrl })
  } else {
    mediaItems.push({ type: 'image', url: primaryUrl })
  }
  galleryImages.forEach(url => mediaItems.push({ type: 'image', url }))

  const [mediaIndex, setMediaIndex] = useState(0)
  const [videoPlaying, setVideoPlaying] = useState(false)

  // Reset video playback when the user navigates away from the video slot
  useEffect(() => { if (mediaIndex !== 0) setVideoPlaying(false) }, [mediaIndex])

  const progress = getProgress(campaign.currentAmount, campaign.goal)

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
          ) : videoPlaying && current.embedUrl ? (
            <iframe
              className="cp-media-iframe"
              src={current.embedUrl}
              title={campaign.title}
              frameBorder="0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div
              className="cp-media-video"
              onClick={() => current.embedUrl ? setVideoPlaying(true) : window.open(current.url, '_blank')}
              role="button"
              tabIndex={0}
            >
              <img src={current.poster} alt={campaign.title} className="cp-media-img" />
              <div className="cp-play-btn"><Play size={24} /></div>
            </div>
          )}
          {mediaItems.length > 1 && (
            <>
              <button className="cp-carousel-arrow cp-carousel-arrow--left" onClick={prev}><ChevronLeft size={18} /></button>
              <button className="cp-carousel-arrow cp-carousel-arrow--right" onClick={next}><ChevronRight size={18} /></button>
              <div className="cp-carousel-dots">
                {mediaItems.map((m, i) => (
                  <span
                    key={i}
                    className={`cp-dot ${i === mediaIndex ? 'active' : ''} ${m.type === 'video' ? 'cp-dot--video' : ''}`}
                    onClick={() => setMediaIndex(i)}
                  />
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
  { key: 'team', label: 'Equipo' },
  { key: 'faq', label: 'FAQ' },
  { key: 'updates', label: 'Actualizaciones' },
  { key: 'comments', label: 'Comentarios' },
]

function CampaignTabs({ active, onChange, tabs }) {
  return (
    <nav className="cp-tabs">
      {tabs.map(tab => (
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

function TeamMemberCard({ member }) {
  const imageSrc = member.imageBase64 ? `data:image/jpeg;base64,${member.imageBase64}` : null

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      member.onOpenCard?.(member)
    }
  }

  return (
    <article
      className="cp-team-card"
      onClick={() => member.onOpenCard?.(member)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="cp-team-avatar-wrap">
        {imageSrc ? (
          <img src={imageSrc} alt={member.name} className="cp-team-avatar" />
        ) : (
          <div className="cp-team-avatar cp-team-avatar--placeholder">
            {(member.name || '?')[0]}
          </div>
        )}
      </div>
      <div className="cp-team-body">
        <h3 className="cp-team-name">{member.name}</h3>
        {member.role && <p className="cp-team-role">{member.role}</p>}
        <DescriptionPreview text={member.bio} />
      </div>
    </article>
  )
}

function CampaignContent({ campaign, rewards, team, faqs, activeTab, onContribute, contributeDisabledReason }) {
  const [activeToc, setActiveToc] = useState(0)
  const [sidebarAmount, setSidebarAmount] = useState(1)
  const [expandedItem, setExpandedItem] = useState(null)
  const leadMember = team[0] || null

  const openRewardDescription = (reward) => {
    setExpandedItem({
      kind: 'reward',
      title: reward.title,
      description: reward.description,
      imageBase64: reward.imageBase64,
      price: reward.price,
    })
  }

  const openTeamDescription = (member) => {
    if (!member) return
    setExpandedItem({
      kind: 'team',
      title: member.name,
      role: member.role,
      description: member.bio,
      imageBase64: member.imageBase64,
    })
  }

  if (activeTab === 'rewards') {
    return (
      <>
        <div className="cp-content-grid">
          <div className="cp-main cp-main--full">
            <h2>Recompensas disponibles</h2>
            {rewards.length > 0 ? (
              <>
                <p className="cp-reward-intro">
                  Cada tier representa un compromiso del creador: si aportás ese monto o más, recibís esa recompensa
                  una vez finalizado el proyecto.
                </p>
                <div className="cp-rewards-grid">
                  {rewards.map((reward) => (
                    <RewardTierCard
                      key={reward.id}
                      reward={reward}
                      onContribute={onContribute}
                      onOpenCard={openRewardDescription}
                      disabledReason={contributeDisabledReason}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="cp-placeholder-text">Esta campaña todavía no publicó recompensas.</p>
            )}
          </div>
        </div>
        <DetailOverlay
          item={expandedItem}
          onClose={() => setExpandedItem(null)}
          onContribute={onContribute}
          disabledReason={contributeDisabledReason}
        />
      </>
    )
  }

  if (activeTab === 'team') {
    return (
      <>
        <div className="cp-content-grid">
          <div className="cp-main cp-main--full">
            <h2>Equipo del proyecto</h2>
            {team.length > 0 ? (
              <div className="cp-team-grid">
                {team.map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    member={{ ...member, onOpenCard: openTeamDescription }}
                  />
                ))}
              </div>
            ) : (
              <p className="cp-placeholder-text">Esta campaña todavía no publicó integrantes del equipo.</p>
            )}
          </div>
        </div>
        <DetailOverlay
          item={expandedItem}
          onClose={() => setExpandedItem(null)}
          onContribute={onContribute}
          disabledReason={contributeDisabledReason}
        />
      </>
    )
  }

  if (activeTab === 'faq') {
    return (
      <div className="cp-content-grid">
        <div className="cp-main cp-main--full">
          <h2>Preguntas frecuentes</h2>
          <div className="cp-faq-list">
            {faqs.map((faq, index) => (
              <article key={faq.id} className="cp-faq-card">
                <div className="cp-faq-index">{String(index + 1).padStart(2, '0')}</div>
                <div className="cp-faq-body">
                  <h3 className="cp-faq-question">{faq.question}</h3>
                  <p className="cp-faq-answer">{faq.answer}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (['updates', 'comments'].includes(activeTab)) {
    const labels = { updates: 'Actualizaciones', comments: 'Comentarios' }
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
    <>
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
          <div
            className={`cp-creator-card ${leadMember ? 'cp-creator-card--clickable' : ''}`}
            onClick={() => leadMember && openTeamDescription(leadMember)}
            onKeyDown={(event) => {
              if (!leadMember) return
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openTeamDescription(leadMember)
              }
            }}
            role={leadMember ? 'button' : undefined}
            tabIndex={leadMember ? 0 : undefined}
          >
            {leadMember?.imageBase64 ? (
              <img src={`data:image/jpeg;base64,${leadMember.imageBase64}`} alt="" className="cp-creator-avatar" />
            ) : campaign.creator?.avatar ? (
              <img src={campaign.creator.avatar} alt="" className="cp-creator-avatar" />
            ) : (
              <div className="cp-creator-avatar cp-creator-avatar--placeholder">
                {(leadMember?.name || campaign.creator?.name || 'C')[0]}
              </div>
            )}
            {leadMember && <span className="cp-creator-badge">Líder del proyecto</span>}
            <span className="cp-creator-name">{leadMember?.name || campaign.creator?.name || 'Creador'}</span>
            <span className="cp-creator-meta">{leadMember?.role || 'Creador del proyecto'}</span>
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

          {rewards.length > 0 && (
            <div className="cp-reward-sidebar">
              <div className="cp-reward-sidebar-header">
                <Gift size={16} />
                <span>Elegí una recompensa</span>
              </div>
              <p className="cp-reward-sidebar-copy">
                Si aportás el monto indicado o uno mayor, el creador se compromete a entregarte esta recompensa.
              </p>
              <div className="cp-reward-sidebar-list">
                {rewards.map((reward) => (
                  <RewardTierCard
                    key={reward.id}
                    reward={reward}
                    onContribute={onContribute}
                    onOpenCard={openRewardDescription}
                    compact
                    disabledReason={contributeDisabledReason}
                  />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
      <DetailOverlay
        item={expandedItem}
        onClose={() => setExpandedItem(null)}
        onContribute={onContribute}
        disabledReason={contributeDisabledReason}
      />
    </>
  )
}

/* ─── Page (orquestador) ─── */

export default function CampaignPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [campaign, setCampaign] = useState(null)
  const [rewards, setRewards] = useState([])
  const [team, setTeam] = useState([])
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('campaign')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAmount, setModalAmount] = useState(1)

  const tabs = TABS.filter(tab => tab.key !== 'faq' || faqs.length > 0)

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
    Promise.all([
      campaignService.getCampaignById(id),
      api.get(`/api/campaigns/${id}/rewards`).catch(() => []),
      api.get(`/api/campaigns/${id}/team`).catch(() => []),
      api.get(`/api/campaigns/${id}/faqs`).catch(() => []),
    ])
      .then(([data, rewardsData, teamData, faqsData]) => {
        if (!data) throw new Error('Campaña no encontrada')
        setCampaign(data)
        setRewards(normalizeRewards(rewardsData))
        setTeam([...(Array.isArray(teamData) ? teamData : [])].sort(
          (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
        ))
        setFaqs([...(Array.isArray(faqsData) ? faqsData : [])].sort(
          (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
        ))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (activeTab === 'faq' && faqs.length === 0) {
      setActiveTab('campaign')
    }
  }, [activeTab, faqs.length])

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
              <CampaignTabs active={activeTab} onChange={setActiveTab} tabs={tabs} />
              <CampaignContent
                campaign={campaign}
                rewards={rewards}
                team={team}
                faqs={faqs}
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
