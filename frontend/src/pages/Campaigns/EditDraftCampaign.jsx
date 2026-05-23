import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Check, AlertCircle, FileText, Image, Film, Gift, HelpCircle, Users, Send, ShieldCheck } from 'lucide-react'
import { Button } from '$components/ui'
import api from '$utils/api/api'
import { useUser } from '../../store/useUser'
import SectionBasicos from './DraftSections/BasicSection'
import SectionHistoria from './DraftSections/HistoriaSection'
import SectionMidia from './DraftSections/MidiaSection'
import SectionRewards from './DraftSections/RewardsSection'
import SectionTeam from './DraftSections/TeamSection'
import SectionFaq from './DraftSections/FaqSection'
import './EditDraftCampaign.css'

const REQUIRED_SECTIONS = [
  {
    key: 'basicos',
    title: 'Básicos',
    subtitle: 'Título, imagen principal, categoría, país, monto objetivo y duración.',
    icon: Image,
    isComplete: (c) => !!(
      c.title && c.shortDescription && c.targetAmount && c.endDate && c.category &&
      c.media?.some(m => m.mediaType === 'IMAGE')
    ),
  },
  {
    key: 'historia',
    title: 'Historia',
    subtitle: 'Contá de qué se trata tu proyecto, cómo funciona y cuáles son los riesgos.',
    icon: FileText,
    isComplete: (c) => !!(c.description && c.description.trim().length > 0),
  },
  {
    key: 'recompensas',
    title: 'Recompensas',
    subtitle: 'Definí las tiers de contribución con sus precios y beneficios.',
    icon: Gift,
    isComplete: (c) => c.rewards?.length > 0,
  },
  {
    key: 'equipo',
    title: 'Equipo',
    subtitle: 'Presentá a las personas detrás del proyecto.',
    icon: Users,
    isComplete: (c) => c.team?.length > 0,
  },
]

const OPTIONAL_SECTIONS = [
  {
    key: 'midia',
    title: 'Media',
    subtitle: 'Video y galería de imágenes (hasta 6, máx. 10 MB cada una).',
    icon: Film,
    // Optional section: marked "complete" once a video or gallery image exists.
    isComplete: (c) => Array.isArray(c.media)
      && c.media.some(m => m.mediaType === 'VIDEO' || (m.mediaType === 'IMAGE' && !m.isPrimary)),
  },
  {
    key: 'faq',
    title: 'Preguntas frecuentes',
    subtitle: 'Anticipá las dudas más comunes de los contribuidores.',
    icon: HelpCircle,
    isComplete: (c) => c.faqs?.length > 0,
  },
]

function SectionHeader({ section, campaign, isOpen, onToggle }) {
  const Icon = section.icon
  const complete = section.isComplete(campaign)

  return (
    <button className={`edc-section-header ${isOpen ? 'edc-section-header--open' : ''}`} onClick={onToggle}>
      <div className={`edc-section-status ${complete ? 'edc-section-status--complete' : ''}`}>
        {complete ? <Check size={16} /> : <AlertCircle size={16} />}
      </div>
      <Icon size={20} className="edc-section-icon" />
      <div className="edc-section-info">
        <span className="edc-section-title">{section.title}</span>
        <span className="edc-section-subtitle">{section.subtitle}</span>
      </div>
      <ChevronDown size={20} className={`edc-section-chevron ${isOpen ? 'edc-section-chevron--open' : ''}`} />
    </button>
  )
}

// Subsection of "Secciones obligatorias": confirms the user is a verified
// creator.  Launching the campaign is gated on this check.
function CreatorCheck({ isCreator }) {
  const navigate = useNavigate()

  if (isCreator) {
    return (
      <div className="edc-section-content">
        <div className="edc-creator-ok">
          <ShieldCheck size={20} />
          <p>Sos un <strong>creador verificado</strong>. Podés lanzar esta campaña.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="edc-section-content">
      <div className="edc-creator-block">
        <AlertCircle size={20} />
        <div className="edc-creator-block-body">
          <p><strong>Necesitás ser creador verificado</strong> para lanzar esta campaña.</p>
          <p>Completá la verificación de creador para poder publicarla.</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/become-creator')}>
          Convertirme en creador
        </Button>
      </div>
    </div>
  )
}

function SectionContent({ sectionKey, campaign, onSaved, isCreator }) {
  if (sectionKey === 'creador') {
    return <CreatorCheck isCreator={isCreator} />
  }

  if (sectionKey === 'basicos') {
    return (
      <div className="edc-section-content">
        <SectionBasicos campaign={campaign} onSaved={onSaved} disableImmutableFields={campaign.status !== 'DRAFT'} />
      </div>
    )
  }

  if (sectionKey === 'historia') {
    return (
      <div className="edc-section-content">
        <SectionHistoria campaign={campaign} onSaved={onSaved} />
      </div>
    )
  }

  if (sectionKey === 'recompensas') {
    return (
      <div className="edc-section-content">
        <SectionRewards campaign={campaign} onSaved={onSaved} />
      </div>
    )
  }

  if (sectionKey === 'midia') {
    return (
      <div className="edc-section-content">
        <SectionMidia campaign={campaign} onSaved={onSaved} />
      </div>
    )
  }

  if (sectionKey === 'equipo') {
    return (
      <div className="edc-section-content">
        <SectionTeam campaign={campaign} onSaved={onSaved} />
      </div>
    )
  }

  if (sectionKey === 'faq') {
    return (
      <div className="edc-section-content">
        <SectionFaq campaign={campaign} onSaved={onSaved} />
      </div>
    )
  }

  return null
}

function SectionGroup({ title, sections, campaign, openSection, onToggle, onSaved, isCreator }) {
  return (
    <div className="edc-group">
      <h2 className="edc-group-title">{title}</h2>
      <div className="edc-sections">
        {sections.map(section => (
          <div key={section.key} className="edc-section">
            <SectionHeader
              section={section}
              campaign={campaign}
              isOpen={openSection === section.key}
              onToggle={() => onToggle(section.key)}
            />
            {openSection === section.key && (
              <SectionContent
                sectionKey={section.key}
                campaign={campaign}
                onSaved={onSaved}
                isCreator={isCreator}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EditDraftCampaign() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openSection, setOpenSection] = useState(null)
  const [publishing, setPublishing] = useState(false)

  const isCreator = !!user && (user.role === 'CREATOR' || user.role === 'ADMIN')

  // First required subsection: creator verification. Launching the campaign
  // depends on this — a non-creator can never complete it, so "Lanzar campaña"
  // stays disabled until the user is a verified creator.
  const requiredSections = useMemo(() => ([
    {
      key: 'creador',
      title: 'Verificación de creador',
      subtitle: 'Solo los creadores verificados pueden lanzar campañas.',
      icon: ShieldCheck,
      isComplete: () => isCreator,
    },
    ...REQUIRED_SECTIONS,
  ]), [isCreator])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/api/campaigns/${id}`),
      api.get(`/api/campaigns/${id}/rewards`),
      api.get(`/api/campaigns/${id}/team`).catch(() => []),
      api.get(`/api/campaigns/${id}/faqs`).catch(() => []),
    ])
      .then(([data, rewards, team, faqs]) => {
        if (!data) throw new Error('Campaña no encontrada')
        setCampaign({ ...data, rewards: rewards || [], team: team || [], faqs: faqs || [] })
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const refreshCampaign = async () => {
    try {
      const [data, rewards, team, faqs] = await Promise.all([
        api.get(`/api/campaigns/${id}`),
        api.get(`/api/campaigns/${id}/rewards`),
        api.get(`/api/campaigns/${id}/team`).catch(() => []),
        api.get(`/api/campaigns/${id}/faqs`).catch(() => []),
      ])
      setCampaign({ ...data, rewards: rewards || [], team: team || [], faqs: faqs || [] })
    } catch (err) {
      console.error('Error refreshing campaign', err)
    }
  }

  const toggleSection = (key) => {
    setOpenSection(prev => prev === key ? null : key)
  }

  const allRequiredComplete = campaign
    ? requiredSections.every(s => s.isComplete(campaign))
    : false

  const handlePublish = async () => {
    if (!allRequiredComplete) return
    setPublishing(true)
    try {
      await api.post(`/api/campaigns/${id}/publish`)
      navigate(`/campaigns/${id}`)
    } catch (err) {
      alert(err.message || 'Error al publicar la campaña')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div className="edc-page">
        <div className="edc-loading">
          <div className="edc-spinner" />
          <p>Cargando campaña...</p>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="edc-page">
        <div className="edc-error">
          <h2>No se pudo cargar la campaña</h2>
          <p>{error || 'La campaña no existe o fue eliminada.'}</p>
          <Button variant="secondary" onClick={() => navigate('/campaigns')}>
            <ArrowLeft size={16} /> Volver a campañas
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="edc-page">
      <div className="edc-container">
        <button className="edc-back" onClick={() => navigate('/campaigns')}>
          <ArrowLeft size={16} /> Mis campañas
        </button>

        <div className="edc-header">
          <h1 className="edc-title">{campaign.title || 'Campaña sin título'}</h1>
          <span className="edc-badge">
            {campaign.status === 'DRAFT' ? 'Borrador' : 'Edición'}
          </span>
        </div>

        <SectionGroup
          title="Secciones obligatorias"
          sections={requiredSections}
          campaign={campaign}
          openSection={openSection}
          onToggle={toggleSection}
          onSaved={refreshCampaign}
          isCreator={isCreator}
        />

        <SectionGroup
          title="Secciones opcionales"
          sections={OPTIONAL_SECTIONS}
          campaign={campaign}
          openSection={openSection}
          onToggle={toggleSection}
          onSaved={refreshCampaign}
        />

        {campaign.status === 'DRAFT' && (
          <div className="edc-publish">
            <Button
              variant="primary"
              size="lg"
              disabled={!allRequiredComplete || publishing}
              onClick={handlePublish}
            >
              <Send size={16} />
              {publishing ? 'Publicando...' : 'Lanzar campaña'}
            </Button>
            {!allRequiredComplete && (
              <p className="edc-publish-hint">Completá todas las secciones obligatorias para poder publicar.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
