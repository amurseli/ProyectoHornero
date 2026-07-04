import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Search, Star } from 'lucide-react'
import api from '../../utils/api'
import './Curador.css'

const MAX_SPOTLIGHT = 2

function Curador() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [query, setQuery] = useState('')

  const fetchCampaigns = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get('/api/admin/campaigns/curator')
      setCampaigns(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Error al cargar campañas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const spotlightCount = useMemo(
    () => campaigns.filter((campaign) => campaign.isSpotlight).length,
    [campaigns],
  )

  const filteredCampaigns = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return campaigns
    return campaigns.filter((campaign) => (campaign.title || '').toLowerCase().includes(normalized))
  }, [campaigns, query])

  const limitReached = spotlightCount >= MAX_SPOTLIGHT

  const handleToggleSpotlight = async (campaign) => {
    const next = !campaign.isSpotlight
    setTogglingId(campaign.id)
    setActionError(null)
    try {
      await api.patch(`/api/admin/campaigns/${campaign.id}/spotlight`, { isSpotlight: next })
      // Reflejamos solo el cambio de esta card, sin re-fetchear toda la lista.
      setCampaigns((prev) =>
        prev.map((item) => (item.id === campaign.id ? { ...item, isSpotlight: next } : item)),
      )
    } catch (err) {
      setActionError(err.message || 'No se pudo actualizar el destacado')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="curador-page">
      <div className="cur-container">
        <div className="cur-header">
          <div>
            <h1>Curador</h1>
            <p>Elegí qué campañas activas aparecen destacadas en la home. Podés destacar hasta {MAX_SPOTLIGHT}.</p>
          </div>
          <div className="cur-counter">
            <Star size={18} />
            <span className="cur-counter-value">{spotlightCount}/{MAX_SPOTLIGHT}</span>
            <span className="cur-counter-label">Destacadas</span>
          </div>
        </div>

        <div className="cur-toolbar">
          <div className="cur-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre de campaña"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="cur-toolbar-note">Solo se muestran campañas en crowdfunding.</div>
        </div>

        {error && <div className="cur-error">{error}</div>}
        {actionError && <div className="cur-error">{actionError}</div>}

        {loading ? (
          <div className="cur-loading">Cargando campañas...</div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="cur-empty">
            <AlertCircle size={40} />
            <p>No hay campañas en crowdfunding para curar.</p>
          </div>
        ) : (
          <div className="cur-grid">
            {filteredCampaigns.map((campaign) => {
              const busy = togglingId === campaign.id
              const disableAdd = !campaign.isSpotlight && (limitReached || busy)
              return (
                <article
                  key={campaign.id}
                  className={`cur-card ${campaign.isSpotlight ? 'cur-card--spotlight' : ''}`}
                >
                  <div className="cur-card-thumb">
                    {campaign.coverImageUrl ? (
                      <img src={campaign.coverImageUrl} alt={campaign.title} loading="lazy" />
                    ) : (
                      <div className="cur-card-thumb--empty">
                        <AlertCircle size={20} />
                      </div>
                    )}
                    {campaign.isSpotlight && (
                      <span className="cur-card-flag">
                        <Star size={12} /> Destacada
                      </span>
                    )}
                  </div>
                  <h2 className="cur-card-title" title={campaign.title}>{campaign.title}</h2>
                  <button
                    type="button"
                    className={`cur-card-btn ${campaign.isSpotlight ? 'cur-card-btn--active' : ''}`}
                    onClick={() => handleToggleSpotlight(campaign)}
                    disabled={disableAdd || busy}
                    title={disableAdd && !campaign.isSpotlight ? `Ya hay ${MAX_SPOTLIGHT} campañas destacadas` : undefined}
                  >
                    <Star size={14} />
                    {campaign.isSpotlight ? 'Quitar' : 'Destacar'}
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Curador
