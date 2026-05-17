import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Check, AlertCircle, FileText, Image, Gift, HelpCircle, Users, Send } from 'lucide-react'
import { Button } from '$components/ui'
import api from '$utils/api/api'
import SectionBasicos from './DraftSections/BasicSection'
import SectionHistoria from './DraftSections/HistoriaSection'
import './EditDraftCampaign.css'

const REQUIRED_SECTIONS = [
  {
    key: 'basicos',
    title: 'Básicos',
    subtitle: 'Título, imagen, video, categoría, monto objetivo y duración.',
    icon: Image,
    isComplete: (c) => !!(c.title && c.targetAmount && c.endDate && c.media?.length > 0),
  },
  {
    key: 'historia',
    title: 'Historia',
    subtitle: 'Contá de qué se trata tu proyecto, cómo funciona y cuáles son los riesgos.',
    icon: FileText,
    isComplete: (c) => !!(c.description && c.description.length > 500),
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
    isComplete: (c) => c.creators?.length > 0,
  },
]

const OPTIONAL_SECTIONS = [
  {
    key: 'faq',
    title: 'Preguntas frecuentes',
    subtitle: 'Anticipá las dudas más comunes de los contribuidores.',
    icon: HelpCircle,
    isComplete: () => true,
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

function SectionContent({ sectionKey, campaign, onSaved }) {
  if (sectionKey === 'basicos') {
    return (
      <div className="edc-section-content">
        <SectionBasicos campaign={campaign} onSaved={onSaved} />
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

  const placeholders = {
    recompensas: 'Acá va el CRUD de tiers de contribución.',
    faq: 'Acá va el CRUD de preguntas frecuentes.',
    equipo: 'Acá se muestran y agregan los miembros del equipo.',
  }

  return (
    <div className="edc-section-content">
      <p className="edc-placeholder">{placeholders[sectionKey]}</p>
    </div>
  )
}
function SectionGroup({ title, sections, campaign, openSection, onToggle, onSaved }) {
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
              <SectionContent sectionKey={section.key} campaign={campaign} onSaved={onSaved} />
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
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openSection, setOpenSection] = useState(null)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/api/campaigns/${id}`)
      .then(data => {
        if (!data) throw new Error('Campaña no encontrada')
        if (data.status !== 'DRAFT') {
          navigate(`/campaigns/${id}`)
          return
        }
        setCampaign(data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const refreshCampaign = () => {
    api.get(`/api/campaigns/${id}`).then(data => setCampaign(data))
  }

  const toggleSection = (key) => {
    setOpenSection(prev => prev === key ? null : key)
  }

  const allRequiredComplete = campaign
    ? REQUIRED_SECTIONS.every(s => s.isComplete(campaign))
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
          <p>Cargando borrador...</p>
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="edc-page">
        <div className="edc-error">
          <h2>No se pudo cargar el borrador</h2>
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
          <span className="edc-badge">Borrador</span>
        </div>

        <SectionGroup
          title="Secciones obligatorias"
          sections={REQUIRED_SECTIONS}
          campaign={campaign}
          openSection={openSection}
          onToggle={toggleSection}
          onSaved={refreshCampaign}
        />

        <SectionGroup
          title="Secciones opcionales"
          sections={OPTIONAL_SECTIONS}
          campaign={campaign}
          openSection={openSection}
          onToggle={toggleSection}
          onSaved={refreshCampaign}
        />

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
      </div>
    </div>
  )
}