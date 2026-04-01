import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight, Clock, Users, TrendingUp, Rocket } from 'lucide-react'
import { Button } from '$components/ui'
import { useUser } from '../../store/useUser'
import api from '$utils/api/api'

function normalizeCampaign(c) {
  const primary = c.media?.find(m => m.isPrimary) || c.media?.[0]
  let imageUrl = '/crowdfunding-campaign.jpg'
  if (primary?.base64Data) imageUrl = `data:image/jpeg;base64,${primary.base64Data}`
  else if (primary?.url) imageUrl = primary.url
  else if (c.imageUrl) imageUrl = c.imageUrl

  return {
    ...c,
    imageUrl,
    goal: c.targetAmount || c.goal || 0,
    raised: c.currentAmount ?? c.raised ?? 0,
    category: c.category?.name || c.category || 'General',
    daysLeft: c.endDate
      ? Math.max(0, Math.ceil((new Date(c.endDate) - new Date()) / 86400000))
      : 30,
  }
}

const STATUS_LABELS = {
  CROWDFUNDING: 'En curso',
  FUNDED: 'Financiada',
  FAILED: 'No alcanzada',
  DRAFT: 'Borrador',
}

function MyCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useUser()
  const navigate = useNavigate()
  const scrollRef = useRef(null)

  useEffect(() => {
    api.get('/api/campaigns')
      .then((data) => {
        const mine = data
          .filter(c => c.owner?.id === user?.userId)
          .map(normalizeCampaign)
          .sort((a, b) => {
            if (a.status === 'CROWDFUNDING' && b.status !== 'CROWDFUNDING') return -1
            if (b.status === 'CROWDFUNDING' && a.status !== 'CROWDFUNDING') return 1
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          })
        setCampaigns(mine)
      })
      .catch(() => setError('No se pudieron cargar las campañas'))
      .finally(() => setLoading(false))
  }, [user])

  const featured = campaigns[0] || null
  const rest = campaigns.slice(1)

  const scroll = (dir) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' })
  }

  if (loading) return <div className="mc-loading"><div className="mc-spinner" /></div>
  if (error) return (
    <div className="mc-error">
      <p>{error}</p>
      <Button variant="primary" onClick={() => window.location.reload()}>Reintentar</Button>
    </div>
  )

  if (!featured) {
    return (
      <main className="mc-page">
        <div className="container mc-empty">
          <div className="mc-empty-icon"><Rocket size={40} /></div>
          <h2>Todavía no tenés campañas</h2>
          <p>Creá tu primera campaña y empezá a recibir apoyo de la comunidad.</p>
          <Button variant="primary" size="lg" onClick={() => navigate('/my-campaigns/new')}>
            <Plus size={18} /> Crear mi primera campaña
          </Button>
        </div>
        <style>{styles}</style>
      </main>
    )
  }

  const progress = featured.goal > 0 ? Math.min((featured.raised / featured.goal) * 100, 100) : 0

  return (
    <main className="mc-page">

      {/* Header */}
      <header className="container mc-header">
        <h1 className="mc-page-title">Mis Campañas</h1>
        <p className="mc-page-subtitle">Gestioná tus proyectos y seguí su progreso</p>
      </header>

      {/* Campaña destacada */}
      <section className="container mc-featured-section">
        <a href={`/campaign/${featured.id}`} className="mc-featured">
          <div className="mc-featured-image">
            <img src={featured.imageUrl} alt={featured.title} />
            <span className="mc-featured-status">
              {STATUS_LABELS[featured.status] || featured.status}
            </span>
          </div>
          <div className="mc-featured-body">
            <span className="mc-featured-category">{featured.category}</span>
            <h2 className="mc-featured-title">{featured.title}</h2>
            {featured.shortDescription && (
              <p className="mc-featured-desc">{featured.shortDescription}</p>
            )}
            <div className="mc-featured-progress">
              <div className="mc-progress-bar">
                <div className="mc-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="mc-progress-labels">
                <span>${featured.raised.toLocaleString('es-AR')} recaudados</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
            </div>
            <div className="mc-featured-stats">
              <div className="mc-fstat">
                <TrendingUp size={16} />
                <span>Meta: ${featured.goal.toLocaleString('es-AR')}</span>
              </div>
              <div className="mc-fstat">
                <Users size={16} />
                <span>{(featured.backers ?? 0).toLocaleString('es-AR')} aportantes</span>
              </div>
              <div className="mc-fstat">
                <Clock size={16} />
                <span>{featured.daysLeft > 0 ? `${featured.daysLeft} días restantes` : 'Finalizada'}</span>
              </div>
            </div>
          </div>
        </a>
      </section>

      {/* Campañas anteriores + crear nueva */}
      <section className="container mc-rest-section">
        {rest.length > 0 && (
          <div className="mc-rest-header">
            <h3 className="mc-rest-title">Campañas anteriores</h3>
            {rest.length > 3 && (
              <div className="mc-scroll-btns">
                <button onClick={() => scroll(-1)} className="mc-scroll-btn"><ChevronLeft size={18} /></button>
                <button onClick={() => scroll(1)} className="mc-scroll-btn"><ChevronRight size={18} /></button>
              </div>
            )}
          </div>
        )}
        <div className="mc-carousel" ref={scrollRef}>
          {rest.map((c) => {
            const p = c.goal > 0 ? Math.min((c.raised / c.goal) * 100, 100) : 0
            return (
              <a key={c.id} href={`/campaign/${c.id}`} className="mc-mini-card">
                <div className="mc-mini-image">
                  <img src={c.imageUrl} alt={c.title} />
                </div>
                <div className="mc-mini-body">
                  <span className="mc-mini-status">{STATUS_LABELS[c.status] || c.status}</span>
                  <h4 className="mc-mini-title">{c.title}</h4>
                  <div className="mc-mini-progress">
                    <div className="mc-progress-bar mc-progress-bar-sm">
                      <div className="mc-progress-fill" style={{ width: `${p}%` }} />
                    </div>
                    <span className="mc-mini-amount">${c.raised.toLocaleString('es-AR')} / ${c.goal.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </a>
            )
          })}
          <button className="mc-mini-card mc-create-card" onClick={() => navigate('/my-campaigns/new')}>
            <div className="mc-create-icon">
              <Plus size={32} />
            </div>
            <span className="mc-create-label">Nueva Campaña</span>
          </button>
        </div>
      </section>

      <style>{styles}</style>
    </main>
  )
}

const styles = `
  .mc-page {
    min-height: 100vh;
    background: var(--color-bg-primary, #fafafa);
    padding-bottom: 4rem;
  }

  .mc-loading { display: flex; justify-content: center; padding: 6rem 0; }
  .mc-spinner {
    width: 2.5rem; height: 2.5rem;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: mc-spin 0.8s linear infinite;
  }
  @keyframes mc-spin { to { transform: rotate(360deg); } }
  .mc-error {
    text-align: center; padding: 6rem 2rem;
    color: var(--color-text-secondary);
    display: flex; flex-direction: column; align-items: center; gap: 1rem;
  }

  /* Empty */
  .mc-empty {
    text-align: center; padding: 8rem 2rem;
    display: flex; flex-direction: column; align-items: center; gap: 1rem;
  }
  .mc-empty-icon {
    width: 5rem; height: 5rem; border-radius: 50%;
    background: color-mix(in srgb, var(--color-primary) 10%, white);
    color: var(--color-primary);
    display: flex; align-items: center; justify-content: center;
  }
  .mc-empty h2 {
    font-size: var(--font-size-2xl); font-weight: 700;
    color: var(--color-text-primary); margin: 0;
  }
  .mc-empty p {
    font-size: var(--font-size-lg); color: var(--color-text-muted);
    max-width: 400px; margin: 0;
  }

  /* Header */
  .mc-header {
    padding-top: 2.5rem;
    padding-bottom: 1.5rem;
  }
  .mc-page-title {
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 700;
    background: var(--gradient-warm);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.2;
    margin: 0;
    animation: mc-fadeUp 0.5s ease both;
  }
  .mc-page-subtitle {
    font-size: var(--font-size-lg);
    color: var(--color-text-muted);
    margin: 0.25rem 0 0;
    animation: mc-fadeUp 0.5s ease 0.1s both;
  }
  @keyframes mc-fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Featured */
  .mc-featured-section {
    padding-top: 0.5rem;
    animation: mc-fadeUp 0.5s ease 0.2s both;
  }
  .mc-featured {
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: white;
    border-radius: var(--radius-xl);
    overflow: hidden;
    border: 1px solid var(--color-border);
    text-decoration: none;
    color: inherit;
    transition: box-shadow var(--transition-base), border-color var(--transition-base);
  }
  .mc-featured:hover {
    box-shadow: var(--shadow-xl);
    border-color: var(--color-primary);
  }
  .mc-featured-image {
    position: relative;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    background: var(--color-muted);
  }
  .mc-featured-image img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.5s ease;
  }
  .mc-featured:hover .mc-featured-image img { transform: scale(1.03); }
  .mc-featured-status {
    position: absolute; top: 1rem; left: 1rem;
    padding: 0.375rem 0.875rem;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(6px);
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs); font-weight: 600;
    color: var(--color-primary);
  }
  .mc-featured-body {
    padding: 2rem;
    display: flex; flex-direction: column; justify-content: center;
  }
  .mc-featured-category {
    font-size: var(--font-size-xs); font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.05em;
    color: var(--color-text-muted); margin-bottom: 0.5rem;
  }
  .mc-featured-title {
    font-size: var(--font-size-2xl); font-weight: 700;
    color: var(--color-text-primary); margin: 0 0 0.5rem;
    line-height: 1.25;
  }
  .mc-featured:hover .mc-featured-title { color: var(--color-primary); }
  .mc-featured-desc {
    font-size: var(--font-size-sm); color: var(--color-text-muted);
    line-height: 1.6; margin: 0 0 1.5rem;
    display: -webkit-box; -webkit-line-clamp: 3;
    -webkit-box-orient: vertical; overflow: hidden;
  }

  /* Progress bar (shared) */
  .mc-featured-progress { margin-bottom: 1.5rem; }
  .mc-progress-bar {
    width: 100%; height: 0.5rem;
    background: var(--color-muted);
    border-radius: var(--radius-full); overflow: hidden;
  }
  .mc-progress-bar-sm { height: 0.25rem; }
  .mc-progress-fill {
    height: 100%;
    background: var(--gradient-warm);
    border-radius: var(--radius-full);
    transition: width 0.5s ease;
  }
  .mc-progress-labels {
    display: flex; justify-content: space-between;
    margin-top: 0.5rem; font-size: var(--font-size-sm);
    color: var(--color-text-secondary); font-weight: 500;
  }

  /* Featured stats */
  .mc-featured-stats {
    display: flex; gap: 1.5rem; flex-wrap: wrap;
  }
  .mc-fstat {
    display: flex; align-items: center; gap: 0.375rem;
    font-size: var(--font-size-sm); color: var(--color-text-secondary);
  }
  .mc-fstat svg { color: var(--color-primary); flex-shrink: 0; }

  /* Carousel section */
  .mc-rest-section {
    padding-top: 2.5rem;
    animation: mc-fadeUp 0.5s ease 0.3s both;
  }
  .mc-rest-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1rem;
  }
  .mc-rest-title {
    font-size: var(--font-size-lg); font-weight: 600;
    color: var(--color-text-primary); margin: 0;
  }
  .mc-scroll-btns { display: flex; gap: 0.5rem; }
  .mc-scroll-btn {
    width: 2rem; height: 2rem; border-radius: var(--radius-md);
    border: 1px solid var(--color-border); background: white;
    color: var(--color-text-secondary); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .mc-scroll-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

  .mc-carousel {
    display: flex; gap: 1rem;
    overflow-x: auto; scroll-snap-type: x mandatory;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding-bottom: 0.5rem;
  }
  .mc-carousel::-webkit-scrollbar { display: none; }

  .mc-mini-card {
    flex: 0 0 260px;
    scroll-snap-align: start;
    background: white;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--color-border);
    text-decoration: none; color: inherit;
    transition: box-shadow var(--transition-base), border-color var(--transition-base);
  }
  .mc-mini-card:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary);
  }
  .mc-mini-image {
    aspect-ratio: 16 / 9; overflow: hidden;
    background: var(--color-muted);
  }
  .mc-mini-image img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.4s ease;
  }
  .mc-mini-card:hover .mc-mini-image img { transform: scale(1.05); }
  .mc-mini-body { padding: 0.875rem; }
  .mc-mini-status {
    font-size: var(--font-size-xs); font-weight: 600;
    color: var(--color-text-muted); text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .mc-mini-title {
    font-size: var(--font-size-sm); font-weight: 600;
    color: var(--color-text-primary); margin: 0.25rem 0 0.625rem;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden;
    line-height: 1.4;
  }
  .mc-mini-card:hover .mc-mini-title { color: var(--color-primary); }
  .mc-mini-progress { display: flex; flex-direction: column; gap: 0.375rem; }
  .mc-mini-amount {
    font-size: var(--font-size-xs); color: var(--color-text-muted);
  }

  /* Create card (last item in carousel) */
  .mc-create-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    border-style: dashed;
    cursor: pointer;
    font-family: inherit;
    min-height: 200px;
  }
  .mc-create-card:hover {
    border-color: var(--color-primary);
    border-style: solid;
  }
  .mc-create-icon {
    width: 4rem; height: 4rem; border-radius: 50%;
    background: color-mix(in srgb, var(--color-primary) 8%, white);
    color: var(--color-primary);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .mc-create-card:hover .mc-create-icon {
    background: var(--gradient-warm);
    color: white;
  }
  .mc-create-label {
    font-size: var(--font-size-sm); font-weight: 600;
    color: var(--color-text-muted);
  }
  .mc-create-card:hover .mc-create-label {
    color: var(--color-primary);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .mc-featured {
      grid-template-columns: 1fr;
    }
    .mc-featured-image { aspect-ratio: 16 / 9; }
    .mc-featured-body { padding: 1.5rem; }
    .mc-featured-stats { gap: 1rem; }
    .mc-mini-card { flex: 0 0 220px; }
  }
`

export default MyCampaigns