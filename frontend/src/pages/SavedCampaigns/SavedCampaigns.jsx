import { Bookmark, Rocket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CampaignWideCard from '$components/features/CampaignWideCard'
import { Button } from '$components/ui'
import { getMediaImageSrc } from '$utils/imageSources'
import savedCampaignService from '$utils/savedCampaignService'
import './SavedCampaigns.css'

function normalizeCampaign(c) {
  const primary = c.media?.find(m => m.isPrimary) || c.media?.[0]
  const primaryImage = getMediaImageSrc(primary)

  return {
    ...c,
    imageUrl: primaryImage || c.imageUrl || '/crowdfunding-campaign.jpg',
    goal: c.targetAmount || c.goal || 0,
    raised: c.currentAmount ?? c.raised ?? 0,
    category: c.category?.name || c.category || 'General',
    daysLeft: c.endDate
      ? Math.max(0, Math.ceil((new Date(c.endDate) - new Date()) / 86400000))
      : 30,
  }
}

function SavedCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    savedCampaignService.listSavedCampaigns()
      .then((data) => {
        setCampaigns((Array.isArray(data) ? data : []).map(normalizeCampaign))
      })
      .catch(() => setError('No se pudieron cargar tus guardados'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <main className="saved-page">
        <div className="saved-loading">
          <div className="saved-spinner" />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="saved-page">
        <div className="saved-error">
          <p>{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </main>
    )
  }

  if (campaigns.length === 0) {
    return (
      <main className="saved-page">
        <div className="container saved-empty">
          <div className="saved-empty-icon"><Bookmark size={36} /></div>
          <h1>Mis guardados</h1>
          <p>Todavía no guardaste campañas. Usá el botón Recordarme para armar tu lista de favoritos.</p>
          <Button variant="primary" size="lg" onClick={() => navigate('/explorar')}>
            <Rocket size={18} /> Explorar campañas
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="saved-page">
      <header className="container saved-header">
        <h1 className="saved-title">Mis guardados</h1>
        <p className="saved-subtitle">Tus campañas favoritas, listas para volver cuando quieras.</p>
      </header>

      <section className="container saved-list">
        {campaigns.map((campaign) => (
          <CampaignWideCard
            key={campaign.id}
            campaign={campaign}
            description={campaign.shortDescription || campaign.description}
            showStatusBadge={campaign.status === 'CROWDFUNDING'}
            statusLabel={campaign.status === 'CROWDFUNDING' ? 'En curso' : null}
          />
        ))}
      </section>
    </main>
  )
}

export default SavedCampaigns
