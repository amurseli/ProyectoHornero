import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { savePostLoginRedirect } from '../../utils/auth/postLoginRedirect'
import { campaignService } from '$utils/campaignService'
import { contributionService } from '$utils/contributionService'
import { getEntityImageSrc, getMediaImageSrc } from '$utils/imageSources'
import { Button } from '$components/ui'
import ContributionModal from '$components/ContributionModal/ContributionModal'
import api from '$utils/api/api'
import { useUser } from '../../store/useUser'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Bookmark, Share2, Users, Tag, Gift, X } from 'lucide-react'
import './CampaignPage.css'

const PUBLIC_DESC_LIMIT = 100

function slugifyHeading(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function extractMarkdownHeadings(markdown) {
  const lines = String(markdown || '').split('\n')
  const seen = new Map()

  return lines.reduce((acc, line) => {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*$/)
    if (!match) return acc

    const text = match[2].trim()
    if (!text) return acc

    const baseId = slugifyHeading(text) || 'historia'
    const index = seen.get(baseId) ?? 0
    seen.set(baseId, index + 1)

    acc.push({
      id: index === 0 ? baseId : `${baseId}-${index + 1}`,
      text,
      level: match[1].length,
    })
    return acc
  }, [])
}

function flattenNodeText(node) {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (!node || !node.props?.children) return ''
  const children = Array.isArray(node.props.children) ? node.props.children : [node.props.children]
  return children.map(flattenNodeText).join('')
}

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

function getRewardAccessState(reward, contributionSummary) {
  const approvedTotal = Number(contributionSummary?.approvedTotal || 0)
  const currentRewardId = contributionSummary?.currentReward?.rewardId || null
  const currentRewardPrice = Number(contributionSummary?.currentReward?.rewardPrice || 0)
  const rewardPrice = Number(reward?.price || 0)
  const remaining = Math.max(0, rewardPrice - approvedTotal)

  if (currentRewardId === reward.id) {
    return {
      status: 'current',
      cta: 'Tier actual',
      helper: 'Ya tenés esta recompensa asignada.',
      remaining: 0,
    }
  }

  if (currentRewardId && rewardPrice <= currentRewardPrice) {
    return {
      status: 'locked',
      cta: 'No disponible',
      helper: 'Ya tenés una recompensa de igual o mayor valor.',
      remaining,
    }
  }

  if (remaining === 0) {
    return {
      status: 'available',
      cta: 'Activar recompensa',
      helper: 'Ya alcanzaste esta tier con tus aportes previos.',
      remaining: 0,
    }
  }

  return {
    status: 'upgrade',
    cta: `Pagar ${formatCurrency(remaining)}`,
    helper: approvedTotal > 0
      ? `Te faltan ${formatCurrency(remaining)} para acceder a esta recompensa.`
      : `Necesitás ${formatCurrency(rewardPrice)} para acceder a esta recompensa.`,
    remaining,
  }
}

function sanitizeContributionAmountInput(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  const normalized = digits.replace(/^0+(\d)/, '$1')
  return normalized || ''
}

function DetailOverlay({ item, onClose, onContribute, disabledReason, contributionSummary }) {
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

  const imageSrc = getEntityImageSrc(item)
  const isReward = item.kind === 'reward'
  const rewardState = isReward ? getRewardAccessState(item, contributionSummary) : null

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
                onClick={() => onContribute({ reward: item })}
                disabled={!!disabledReason || rewardState?.status === 'current' || rewardState?.status === 'locked'}
                title={disabledReason || rewardState?.helper || undefined}
              >
                {rewardState?.cta || `Elegir ${formatCurrency(item.price || 0)}`}
              </Button>
              {!disabledReason && rewardState?.helper && <p className="cp-reward-disabled">{rewardState.helper}</p>}
              {disabledReason && <p className="cp-reward-disabled">{disabledReason}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function RewardTierCard({ reward, onContribute, onOpenCard, compact = false, disabledReason = null, contributionSummary = null }) {
  const imageSrc = getEntityImageSrc(reward)
  const rewardState = getRewardAccessState(reward, contributionSummary)

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
            onContribute({ reward })
          }}
          disabled={!!disabledReason || rewardState.status === 'current' || rewardState.status === 'locked'}
          title={disabledReason || rewardState.helper || undefined}
        >
          {rewardState.cta}
        </Button>
        {disabledReason
          ? <p className="cp-reward-disabled">{disabledReason}</p>
          : <p className="cp-reward-disabled">{rewardState.helper}</p>}
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
    ? getMediaImageSrc(primary)
    : (campaign.imageUrl || '/crowdfunding-campaign.jpg')
  const galleryImages = allImages
    .filter(m => m !== primary)
    .map(getMediaImageSrc)
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
            onClick={() => onContribute({ amount: 1 })}
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
  { key: 'history', label: 'Historia' },
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

function TeamMemberCard({ member }) {
  const imageSrc = getEntityImageSrc(member)

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

function CampaignContent({ campaign, rewards, team, faqs, activeTab, onContribute, contributeDisabledReason, contributionSummary }) {
  const storyHeadings = useMemo(() => extractMarkdownHeadings(campaign.description), [campaign.description])
  const tocItems = useMemo(() => (
    storyHeadings.length > 0
      ? storyHeadings
      : [{ id: 'historia', text: 'Historia', level: 1 }]
  ), [storyHeadings])
  const [activeToc, setActiveToc] = useState(tocItems[0]?.id || 'historia')
  const [sidebarAmount, setSidebarAmount] = useState('1')
  const [expandedItem, setExpandedItem] = useState(null)
  const leadMember = team[0] || null
  const storyRef = useRef(null)
  const currentReward = rewards.find(r => r.id === contributionSummary?.currentReward?.rewardId) || null

  useEffect(() => {
    setActiveToc(tocItems[0]?.id || 'historia')
  }, [tocItems])

  useEffect(() => {
    if (activeTab !== 'history') return undefined

    const root = storyRef.current
    if (!root) return undefined

    const headingElements = tocItems
      .map(item => document.getElementById(item.id))
      .filter(Boolean)

    if (headingElements.length === 0) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length > 0) {
          setActiveToc(visible[0].target.id)
        }
      },
      {
        rootMargin: '-25% 0px -55% 0px',
        threshold: [0, 0.2, 0.6, 1],
      }
    )

    headingElements.forEach(element => observer.observe(element))
    return () => observer.disconnect()
  }, [activeTab, tocItems])

  const scrollToHeading = (id) => {
    const element = document.getElementById(id)
    if (!element) return
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveToc(id)
  }

  const markdownComponents = useMemo(() => {
    const headingIndex = tocItems.reduce((acc, item) => {
      const key = `${item.level}:${item.text}`
      const ids = acc.get(key) || []
      ids.push(item.id)
      acc.set(key, ids)
      return acc
    }, new Map())
    const headingUsage = new Map()

    const buildHeading = (Tag) => ({ children, ...props }) => {
      const text = flattenNodeText({ props: { children } }).trim()
      const level = Number(Tag.slice(1))
      const key = `${level}:${text}`
      const used = headingUsage.get(key) ?? 0
      const ids = headingIndex.get(key) || []
      const id = ids[used] || slugifyHeading(text) || 'historia'
      headingUsage.set(key, used + 1)
      return <Tag id={id} className="cp-story-heading" {...props}>{children}</Tag>
    }

    return {
      h1: buildHeading('h1'),
      h2: buildHeading('h2'),
      h3: buildHeading('h3'),
      h4: buildHeading('h4'),
      h5: buildHeading('h5'),
      h6: buildHeading('h6'),
      img: ({ src, alt }) => <img src={src} alt={alt || ''} className="cp-story-image" />,
      a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noreferrer">
          {children}
        </a>
      ),
    }
  }, [tocItems])

  const openRewardDescription = (reward) => {
    setExpandedItem({
      kind: 'reward',
      title: reward.title,
      description: reward.description,
      imageBase64: reward.imageBase64,
      imageS3Key: reward.imageS3Key,
      imageUrl: reward.imageUrl,
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
      imageS3Key: member.imageS3Key,
      imageUrl: member.imageUrl,
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
                      contributionSummary={contributionSummary}
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
          contributionSummary={contributionSummary}
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

  // Tab "history" (default)
  return (
    <>
      <div className="cp-content-grid">
        {/* TOC */}
        <aside className="cp-toc">
          <span className="cp-toc-title">Contenido</span>
          {tocItems.map((item) => (
            <button
              key={item.id}
              className={`cp-toc-link cp-toc-link--level-${Math.min(item.level, 3)} ${activeToc === item.id ? 'active' : ''}`}
              onClick={() => scrollToHeading(item.id)}
            >
              {item.text}
            </button>
          ))}
        </aside>

        {/* Main content */}
        <div className="cp-main cp-story" ref={storyRef}>
          {campaign.imageUrl && (
            <div className="cp-content-image">
              <img src={campaign.imageUrl} alt="" />
            </div>
          )}

          {campaign.description?.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {campaign.description}
            </ReactMarkdown>
          ) : (
            <>
              <h2 id="historia" className="cp-story-heading">Historia</h2>
              <p className="cp-placeholder-text">Esta campaña todavía no tiene historia publicada.</p>
            </>
          )}
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
            {getEntityImageSrc(leadMember) ? (
              <img src={getEntityImageSrc(leadMember)} alt="" className="cp-creator-avatar" />
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
            {contributionSummary?.approvedTotal > 0 && (
              <p className="cp-contribute-progress">
                Ya aportaste {formatCurrency(contributionSummary.approvedTotal)} en esta campaña.
              </p>
            )}
            <div className="cp-amount-input">
              <span className="cp-amount-prefix">ARS $</span>
              <input
                type="text"
                inputMode="numeric"
                value={sidebarAmount}
                onChange={(e) => setSidebarAmount(sanitizeContributionAmountInput(e.target.value))}
                className="cp-amount-field"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              className="cp-contribute-btn"
              onClick={() => onContribute(Number(sidebarAmount || 0))}
              disabled={!!contributeDisabledReason || !sidebarAmount || Number(sidebarAmount) < 1}
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
              {contributionSummary?.currentReward && (
                <div className="cp-current-tier">
                  Tu tier actual: <strong>{currentReward?.title || formatCurrency(contributionSummary.currentReward.rewardPrice)}</strong>
                </div>
              )}
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
                    contributionSummary={contributionSummary}
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
        contributionSummary={contributionSummary}
      />
    </>
  )
}

/* ─── Page (orquestador) ─── */

export default function CampaignPage() {
  const { id: idParam, username, titleSlug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()
  const [campaign, setCampaign] = useState(null)
  const id = campaign?.id ?? idParam
  const [rewards, setRewards] = useState([])
  const [team, setTeam] = useState([])
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('history')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState({ amount: 1, reward: null })
  const [contributionSummary, setContributionSummary] = useState(null)

  const tabs = TABS.filter(tab => {
    if (tab.key === 'faq') return faqs.length > 0
    return true
  })

  function openModal(selection = {}) {
    if (!user) {
      savePostLoginRedirect(`${location.pathname}${location.search || ''}`)
      navigate('/login')
      return
    }
    if (typeof selection === 'number') {
      setModalConfig({ amount: selection, reward: null })
    } else {
      setModalConfig({
        amount: Number(selection.amount) || 1,
        reward: selection.reward || null,
      })
    }
    setModalOpen(true)
  }

  function refreshContributionSummary() {
    if (!user || !id) {
      setContributionSummary(null)
      return
    }
    contributionService.getCampaignSummary(id)
      .then(setContributionSummary)
      .catch(() => setContributionSummary(null))
  }

  function refreshCampaign() {
    const fetchPrimary = (username && titleSlug)
      ? campaignService.getCampaignBySlug(username, titleSlug)
      : campaignService.getCampaignById(idParam)
    fetchPrimary.then(data => { if (data) setCampaign(data) }).catch(() => {})
  }

  function handleContributionCompleted() {
    refreshCampaign()
    refreshContributionSummary()
  }

  function getContributeDisabledReason(c) {
    if (!c) return null
    if (c.isTest) return 'Esta es una campaña de demostración y no acepta contribuciones'
    if (c.status !== 'CROWDFUNDING') return 'Esta campaña no está activa para recibir contribuciones'
    if (user && c.owner?.id === user.userId) return 'No podés patrocinar tu propia campaña'
    return null
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setCampaign(null)

    const fetchPrimary = (username && titleSlug)
      ? campaignService.getCampaignBySlug(username, titleSlug)
      : campaignService.getCampaignById(idParam)

    fetchPrimary
      .then(data => {
        if (cancelled) return null
        if (!data) throw new Error('Campaña no encontrada')
        setCampaign(data)
        return Promise.all([
          api.get(`/api/campaigns/${data.id}/rewards`).catch(() => []),
          api.get(`/api/campaigns/${data.id}/team`).catch(() => []),
          api.get(`/api/campaigns/${data.id}/faqs`).catch(() => []),
        ])
      })
      .then(extras => {
        if (cancelled || !extras) return
        const [rewardsData, teamData, faqsData] = extras
        setRewards(normalizeRewards(rewardsData))
        setTeam([...(Array.isArray(teamData) ? teamData : [])].sort(
          (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
        ))
        setFaqs([...(Array.isArray(faqsData) ? faqsData : [])].sort(
          (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
        ))
      })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [idParam, username, titleSlug])

  useEffect(() => {
    if (activeTab === 'faq' && faqs.length === 0) {
      setActiveTab('history')
    }
  }, [activeTab, faqs.length])

  useEffect(() => {
    if (!user) {
      setContributionSummary(null)
      return undefined
    }
    refreshContributionSummary()
    return undefined
  }, [id, user])

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
          <Button variant="secondary" onClick={() => navigate('/explorar')}>
            <ArrowLeft size={16} /> Explorar otros proyectos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="cp-page">
      <div className="cp-container">
        <button className="cp-back" onClick={() => navigate('/explorar')}>
          <ArrowLeft size={16} /> Explorar otros proyectos
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
                contributionSummary={contributionSummary}
              />
            </>
          )
        })()}
        {modalOpen && (
          <ContributionModal
            campaignId={Number(id)}
            initialAmount={modalConfig.amount}
            reward={modalConfig.reward}
            onCompleted={handleContributionCompleted}
            onClose={() => setModalOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
