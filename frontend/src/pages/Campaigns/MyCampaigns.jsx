import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight, Clock, Users, TrendingUp, Rocket, Pencil, ShieldCheck, AlertTriangle, Info } from 'lucide-react'
import { Button } from '$components/ui'
import { useUser } from '../../store/useUser'
import api from '$utils/api/api'
import { getMediaImageSrc } from '$utils/imageSources'

function normalizeCampaign(c) {
  const primary = c.media?.find(m => m.isPrimary) || c.media?.[0]
  let imageUrl = '/crowdfunding-campaign.jpg'
  const primaryImage = getMediaImageSrc(primary)
  if (primaryImage) imageUrl = primaryImage
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

function ScrollableRow({ items, renderItem, scrollAmount = 300 }) {
  const scrollRef = useRef(null)
  const scroll = (dir) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' })
  }
  const showArrows = items.length > 3

  return (
    <>
      {showArrows && (
        <div className="mc-scroll-btns">
          <button onClick={() => scroll(-1)} className="mc-scroll-btn"><ChevronLeft size={18} /></button>
          <button onClick={() => scroll(1)} className="mc-scroll-btn"><ChevronRight size={18} /></button>
        </div>
      )}
      <div className="mc-carousel" ref={scrollRef}>
        {items.map(renderItem)}
      </div>
    </>
  )
}

function MyCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [verification, setVerification] = useState(null)
  const [publishing, setPublishing] = useState(null)
  const { user } = useUser()
  const navigate = useNavigate()
  const isCreator = user?.role === 'CREATOR' || user?.role === 'ADMIN'

  async function handlePublish(e, campaignId) {
    e.preventDefault()
    e.stopPropagation()
    setPublishing(campaignId)
    try {
      await api.post(`/api/campaigns/${campaignId}/publish`)
      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, status: 'CROWDFUNDING' } : c
      ))
    } catch (err) {
      alert(err?.message || 'No se pudo publicar la campaña. Verificá que esté completa.')
    } finally {
      setPublishing(null)
    }
  }

  useEffect(() => {
    api.get('/api/users/me/campaigns')
      .then((data) => {
        const mine = data
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

  useEffect(() => {
    if (isCreator) return
    api.get('/api/users/me/verification')
      .then(data => setVerification(data))
      .catch(() => setVerification(null))
  }, [user, isCreator])

  const verifStatus = verification?.verificationStatus ?? verification?.status ?? 'NOT_SUBMITTED'

  const active = campaigns.find(c => c.status === 'CROWDFUNDING') || null
  const drafts = campaigns.filter(c => c.status === 'DRAFT')
  const previous = campaigns.filter(c => c.status !== 'CROWDFUNDING' && c.status !== 'DRAFT')

  if (loading) return <div className="mc-loading"><div className="mc-spinner" /></div>
  if (error) return (
    <div className="mc-error">
      <p>{error}</p>
      <Button variant="primary" onClick={() => window.location.reload()}>Reintentar</Button>
    </div>
  )

  if (campaigns.length === 0) {
    return (
      <main className="mc-page">
        {!isCreator && (
          <section className="container mc-verification-banner">
            {verifStatus === 'PENDING' ? (
              <div className="mc-vb mc-vb--pending">
                <Info size={22} />
                <div className="mc-vb-content">
                  <strong>Verificación en revisión</strong>
                  <p>Tu solicitud está siendo evaluada por nuestro equipo. Te notificaremos cuando haya una respuesta.</p>
                </div>
              </div>
            ) : verifStatus === 'REJECTED' ? (
              <div className="mc-vb mc-vb--rejected">
                <AlertTriangle size={22} />
                <div className="mc-vb-content">
                  <strong>Verificación rechazada</strong>
                  <p>{verification?.rejectionReason || 'Tu solicitud fue rechazada. Podés volver a intentarlo.'}</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => navigate('/become-creator')}>Reintentar</Button>
              </div>
            ) : (
              <div className="mc-vb mc-vb--info">
                <ShieldCheck size={22} />
                <div className="mc-vb-content">
                  <strong>Verificá tu identidad para publicar campañas</strong>
                  <p>Necesitás ser creador verificado para que tus campañas se publiquen.</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => navigate('/become-creator')}>Verificarme</Button>
              </div>
            )}
          </section>
        )}
        <div className="container mc-empty">
          <div className="mc-empty-icon"><Rocket size={40} /></div>
          <h2>Todavía no tenés campañas</h2>
          <p>Creá tu primera campaña y empezá a recibir apoyo de la comunidad.</p>
          <Button variant="primary" size="lg" onClick={() => navigate('/campaigns/new')}>
            <Plus size={18} /> Crear mi primera campaña
          </Button>
        </div>
        <style>{styles}</style>
      </main>
    )
  }

  const progress = active && active.goal > 0
    ? Math.min((active.raised / active.goal) * 100, 100)
    : 0

  return (
    <main className="mc-page">
      <header className="container mc-header">
        <h1 className="mc-page-title">Mis Campañas</h1>
        <p className="mc-page-subtitle">Gestioná tus proyectos y seguí su progreso</p>
      </header>

      {!isCreator && (
        <section className="container mc-verification-banner">
          {verifStatus === 'PENDING' ? (
            <div className="mc-vb mc-vb--pending">
              <Info size={22} />
              <div className="mc-vb-content">
                <strong>Verificación en revisión</strong>
                <p>Tu solicitud está siendo evaluada por nuestro equipo. Te notificaremos cuando haya una respuesta.</p>
              </div>
            </div>
          ) : verifStatus === 'REJECTED' ? (
            <div className="mc-vb mc-vb--rejected">
              <AlertTriangle size={22} />
              <div className="mc-vb-content">
                <strong>Verificación rechazada</strong>
                <p>{verification?.rejectionReason || 'Tu solicitud fue rechazada. Podés volver a intentarlo.'}</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => navigate('/become-creator')}>Reintentar</Button>
            </div>
          ) : (
            <div className="mc-vb mc-vb--info">
              <ShieldCheck size={22} />
              <div className="mc-vb-content">
                <strong>Verificá tu identidad para publicar campañas</strong>
                <p>Necesitás ser creador verificado para que tus campañas se publiquen.</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => navigate('/become-creator')}>Verificarme</Button>
            </div>
          )}
        </section>
      )}

      {active && (
        <section className="container mc-featured-section">
          <a href={`/campaigns/${active.id}/manage`} className="mc-featured">
            <div className="mc-featured-image">
              <img src={active.imageUrl} alt={active.title} />
              <span className="mc-featured-status">
                {STATUS_LABELS[active.status] || active.status}
              </span>
            </div>
            <div className="mc-featured-body">
              <span className="mc-featured-category">{active.category}</span>
              <h2 className="mc-featured-title">{active.title}</h2>
              {active.shortDescription && (
                <p className="mc-featured-desc">{active.shortDescription}</p>
              )}
              <div className="mc-featured-progress">
                <div className="mc-progress-bar">
                  <div className="mc-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="mc-progress-labels">
                  <span>${active.raised.toLocaleString('es-AR')} recaudados</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
              </div>
              <div className="mc-featured-stats">
                <div className="mc-fstat">
                  <TrendingUp size={16} />
                  <span>Meta: ${active.goal.toLocaleString('es-AR')}</span>
                </div>
                <div className="mc-fstat">
                  <Users size={16} />
                  <span>{(active.backers ?? 0).toLocaleString('es-AR')} aportantes</span>
                </div>
                <div className="mc-fstat">
                  <Clock size={16} />
                  <span>{active.daysLeft > 0 ? `${active.daysLeft} días restantes` : 'Finalizada'}</span>
                </div>
              </div>
            </div>
          </a>
        </section>
      )}

      {/* Borradores */}
      <section className="container mc-rest-section">
        <div className="mc-rest-header">
          <h3 className="mc-rest-title">Borradores</h3>
        </div>
        <ScrollableRow
          items={[...drafts, '__create__']}
          renderItem={(item) => {
            if (item === '__create__') {
              return (
                <button key="create" className="mc-mini-card mc-create-card" onClick={() => navigate('/campaigns/new')}>
                  <div className="mc-create-icon"><Plus size={32} /></div>
                  <span className="mc-create-label">Nueva Campaña</span>
                </button>
              )
            }
            return (
              <a key={item.id} href={`/campaigns/${item.id}/manage`} className="mc-mini-card mc-draft-card">
                <div className="mc-mini-image">
                  <img src={item.imageUrl} alt={item.title} />
                  <span className="mc-draft-badge"><Pencil size={12} /> Borrador</span>
                </div>
                <div className="mc-mini-body">
                  <h4 className="mc-mini-title">{item.title}</h4>
                  <p className="mc-draft-hint">Campaña sin publicar</p>
                  <button
                    className="mc-publish-btn"
                    onClick={(e) => handlePublish(e, item.id)}
                    disabled={publishing === item.id || !isCreator}
                    title={!isCreator ? 'Necesitás ser creador verificado para publicar' : undefined}
                  >
                    {publishing === item.id ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </a>
            )
          }}
        />
      </section>

      {previous.length > 0 && (
        <section className="container mc-rest-section">
          <div className="mc-rest-header">
            <h3 className="mc-rest-title">Campañas anteriores</h3>
          </div>
          <ScrollableRow
            items={previous}
            renderItem={(c) => {
              const p = c.goal > 0 ? Math.min((c.raised / c.goal) * 100, 100) : 0
              return (
                <a key={c.id} href={`/campaigns/${c.id}/manage`} className="mc-mini-card">
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
            }}
          />
        </section>
      )}

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

  .mc-header { padding-top: 2.5rem; padding-bottom: 1.5rem; }
  .mc-page-title {
    font-size: clamp(2rem, 5vw, 3rem); font-weight: 700;
    background: var(--gradient-warm);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; line-height: 1.2; margin: 0;
    animation: mc-fadeUp 0.5s ease both;
  }
  .mc-page-subtitle {
    font-size: var(--font-size-lg); color: var(--color-text-muted);
    margin: 0.25rem 0 0; animation: mc-fadeUp 0.5s ease 0.1s both;
  }
  @keyframes mc-fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .mc-featured-section { padding-top: 0.5rem; animation: mc-fadeUp 0.5s ease 0.2s both; }
  .mc-featured {
    display: grid; grid-template-columns: 1fr 1fr;
    background: white; border-radius: var(--radius-xl); overflow: hidden;
    border: 1px solid var(--color-border); text-decoration: none; color: inherit;
    transition: box-shadow var(--transition-base), border-color var(--transition-base);
  }
  .mc-featured:hover { box-shadow: var(--shadow-xl); border-color: var(--color-primary); }
  .mc-featured-image {
    position: relative; aspect-ratio: 16 / 10; overflow: hidden; background: var(--color-muted);
  }
  .mc-featured-image img {
    width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;
  }
  .mc-featured:hover .mc-featured-image img { transform: scale(1.03); }
  .mc-featured-status {
    position: absolute; top: 1rem; left: 1rem;
    padding: 0.375rem 0.875rem; background: rgba(255,255,255,0.92);
    backdrop-filter: blur(6px); border-radius: var(--radius-full);
    font-size: var(--font-size-xs); font-weight: 600; color: var(--color-primary);
  }
  .mc-featured-body {
    padding: 2rem; display: flex; flex-direction: column; justify-content: center;
  }
  .mc-featured-category {
    font-size: var(--font-size-xs); font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.05em;
    color: var(--color-text-muted); margin-bottom: 0.5rem;
  }
  .mc-featured-title {
    font-size: var(--font-size-2xl); font-weight: 700;
    color: var(--color-text-primary); margin: 0 0 0.5rem; line-height: 1.25;
  }
  .mc-featured:hover .mc-featured-title { color: var(--color-primary); }
  .mc-featured-desc {
    font-size: var(--font-size-sm); color: var(--color-text-muted);
    line-height: 1.6; margin: 0 0 1.5rem;
    display: -webkit-box; -webkit-line-clamp: 3;
    -webkit-box-orient: vertical; overflow: hidden;
  }

  .mc-featured-progress { margin-bottom: 1.5rem; }
  .mc-progress-bar {
    width: 100%; height: 0.5rem; background: var(--color-muted);
    border-radius: var(--radius-full); overflow: hidden;
  }
  .mc-progress-bar-sm { height: 0.25rem; }
  .mc-progress-fill {
    height: 100%; background: var(--gradient-warm);
    border-radius: var(--radius-full); transition: width 0.5s ease;
  }
  .mc-progress-labels {
    display: flex; justify-content: space-between;
    margin-top: 0.5rem; font-size: var(--font-size-sm);
    color: var(--color-text-secondary); font-weight: 500;
  }

  .mc-featured-stats { display: flex; gap: 1.5rem; flex-wrap: wrap; }
  .mc-fstat {
    display: flex; align-items: center; gap: 0.375rem;
    font-size: var(--font-size-sm); color: var(--color-text-secondary);
  }
  .mc-fstat svg { color: var(--color-primary); flex-shrink: 0; }

  .mc-rest-section { padding-top: 2.5rem; animation: mc-fadeUp 0.5s ease 0.3s both; }
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
    display: flex; gap: 1rem; overflow-x: auto; scroll-snap-type: x mandatory;
    scrollbar-width: none; -ms-overflow-style: none; padding-bottom: 0.5rem;
  }
  .mc-carousel::-webkit-scrollbar { display: none; }

  .mc-mini-card {
    flex: 0 0 260px; scroll-snap-align: start;
    background: white; border-radius: var(--radius-lg); overflow: hidden;
    border: 1px solid var(--color-border); text-decoration: none; color: inherit;
    transition: box-shadow var(--transition-base), border-color var(--transition-base);
  }
  .mc-mini-card:hover { box-shadow: var(--shadow-md); border-color: var(--color-primary); }
  .mc-mini-image {
    position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: var(--color-muted);
  }
  .mc-mini-image img {
    width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease;
  }
  .mc-mini-card:hover .mc-mini-image img { transform: scale(1.05); }
  .mc-mini-body { padding: 0.875rem; }
  .mc-mini-status {
    font-size: var(--font-size-xs); font-weight: 600;
    color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em;
  }
  .mc-mini-title {
    font-size: var(--font-size-sm); font-weight: 600;
    color: var(--color-text-primary); margin: 0.25rem 0 0.625rem;
    display: -webkit-box; -webkit-line-clamp: 2;
    -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;
  }
  .mc-mini-card:hover .mc-mini-title { color: var(--color-primary); }
  .mc-mini-progress { display: flex; flex-direction: column; gap: 0.375rem; }
  .mc-mini-amount { font-size: var(--font-size-xs); color: var(--color-text-muted); }

  /* Draft cards */
  .mc-draft-card { border-style: dashed; }
  .mc-draft-card:hover { border-style: solid; }
  .mc-draft-badge {
    position: absolute; top: 0.75rem; left: 0.75rem;
    display: flex; align-items: center; gap: 0.25rem;
    padding: 0.25rem 0.625rem;
    background: rgba(0,0,0,0.6); color: white;
    border-radius: var(--radius-full);
    font-size: var(--font-size-xs); font-weight: 600;
  }
  .mc-draft-hint {
    font-size: var(--font-size-xs); color: var(--color-text-muted);
    margin: 0 0 0.625rem;
  }
  .mc-publish-btn {
    width: 100%; padding: 0.4rem 0;
    background: var(--color-primary); color: white;
    border: none; border-radius: var(--radius-md);
    font-size: var(--font-size-xs); font-weight: 600;
    cursor: pointer; font-family: inherit;
    transition: opacity var(--transition-fast);
  }
  .mc-publish-btn:hover { opacity: 0.88; }
  .mc-publish-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Create card */
  .mc-create-card {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 0.75rem;
    border-style: dashed; cursor: pointer; font-family: inherit; min-height: 200px;
  }
  .mc-create-card:hover { border-color: var(--color-primary); border-style: solid; }
  .mc-create-icon {
    width: 4rem; height: 4rem; border-radius: 50%;
    background: color-mix(in srgb, var(--color-primary) 8%, white);
    color: var(--color-primary);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .mc-create-card:hover .mc-create-icon { background: var(--gradient-warm); color: white; }
  .mc-create-label {
    font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-muted);
  }
  .mc-create-card:hover .mc-create-label { color: var(--color-primary); }

  @media (max-width: 768px) {
    .mc-featured { grid-template-columns: 1fr; }
    .mc-featured-image { aspect-ratio: 16 / 9; }
    .mc-featured-body { padding: 1.5rem; }
    .mc-featured-stats { gap: 1rem; }
    .mc-mini-card { flex: 0 0 220px; }
    .mc-vb { flex-direction: column; text-align: center; }
  }

  /* Verification banner */
  .mc-verification-banner { padding-top: 0; animation: mc-fadeUp 0.5s ease 0.15s both; }
  .mc-vb {
    display: flex; align-items: center; gap: 1rem;
    padding: 1rem 1.5rem; border-radius: var(--radius-lg);
    border: 1px solid; font-size: var(--font-size-sm);
  }
  .mc-vb > svg { flex-shrink: 0; }
  .mc-vb-content { flex: 1; }
  .mc-vb-content strong { display: block; margin-bottom: 0.125rem; }
  .mc-vb-content p { margin: 0; opacity: 0.85; }
  .mc-vb--info {
    background: color-mix(in srgb, var(--color-primary) 6%, white);
    border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
    color: var(--color-primary);
  }
  .mc-vb--pending {
    background: color-mix(in srgb, #f59e0b 6%, white);
    border-color: color-mix(in srgb, #f59e0b 25%, transparent);
    color: #92400e;
  }
  .mc-vb--rejected {
    background: color-mix(in srgb, #ef4444 6%, white);
    border-color: color-mix(in srgb, #ef4444 25%, transparent);
    color: #991b1b;
  }
`

export default MyCampaigns
