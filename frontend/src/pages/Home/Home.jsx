import './Home.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '$utils/api/api';

function Home() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchCampaigns = () => {
    setLoading(true);
    setError(null);
    api.get('/api/campaigns')
      .then((data) => {
        setCampaigns(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al obtener campañas:', err);
        setError('No pudimos cargar las campañas');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const getImageUrl = (campaign) => {
    const primaryMedia = campaign.media?.find(m => m.isPrimary);
    return primaryMedia?.url || campaign.media?.[0]?.url || null;
  };

  const getProgress = (campaign) => {
    if (!campaign.targetAmount || campaign.targetAmount === 0) return 0;
    return Math.min(100, Math.round((campaign.currentAmount || 0) / campaign.targetAmount * 100));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const groupByCategory = () => {
    const groups = {};
    campaigns.forEach((campaign) => {
      const categoryName = campaign.category?.name || 'Otros';
      if (!groups[categoryName]) groups[categoryName] = [];
      groups[categoryName].push(campaign);
    });
    return groups;
  };

  const categorizedCampaigns = groupByCategory();
  const categoryNames = Object.keys(categorizedCampaigns);

  const CategoryRow = ({ title, campaigns }) => {
    const containerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const update = () => {
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollWidth > el.clientWidth + el.scrollLeft + 1);
      };
      update();
      el.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      return () => {
        el.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
      };
    }, [campaigns]);

    const scroll = (dir) => {
      containerRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
    };

    if (!campaigns?.length) return null;

    return (
      <section className="category-row">
        <div className="category-header">
          <h2 className="category-title">{title}</h2>
          <Link to={`/campaigns?category=${encodeURIComponent(title)}`} className="category-link">
            Ver todos →
          </Link>
        </div>
        <div className="campaigns-carousel">
          <button
            className={`carousel-btn left ${canScrollLeft ? 'visible' : ''}`}
            onClick={() => scroll(-1)}
            aria-label="Anterior"
          >
            ‹
          </button>
          <div className="carousel-container" ref={containerRef}>
            {campaigns.map((campaign) => (
              <article
                key={campaign.id}
                className="campaign-card"
                onClick={() => navigate(`/campaigns/${campaign.id}`)}
              >
                <div className="campaign-card-inner">
                  <div className="campaign-thumbnail">
                    {getImageUrl(campaign) ? (
                      <img src={getImageUrl(campaign)} alt={campaign.title} />
                    ) : (
                      <div className="campaign-thumbnail-placeholder">🏠</div>
                    )}
                    {campaign.category?.name && (
                      <span className="campaign-badge">{campaign.category.name}</span>
                    )}
                  </div>
                  <div className="campaign-info">
                    <h3 className="campaign-title">{campaign.title}</h3>
                    <p className="campaign-description">
                      {campaign.shortDescription || 'Apoyá este proyecto y sé parte del cambio'}
                    </p>
                    {campaign.targetAmount > 0 && (
                      <div className="campaign-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${getProgress(campaign)}%` }} />
                        </div>
                        <div className="progress-stats">
                          <span className="progress-amount">{formatCurrency(campaign.currentAmount)}</span>
                          <span className="progress-percent">{getProgress(campaign)}%</span>
                        </div>
                        <span className="progress-goal">Meta: {formatCurrency(campaign.targetAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <button
            className={`carousel-btn right ${canScrollRight ? 'visible' : ''}`}
            onClick={() => scroll(1)}
            aria-label="Siguiente"
          >
            ›
          </button>
        </div>
      </section>
    );
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="home-state">
          <div className="spinner" />
          <p>Cargando campañas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="home-state">
          <span className="state-icon">⚠️</span>
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchCampaigns}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Financiá ideas, construí futuro</h1>
          <p className="hero-subtitle">
            Descubrí proyectos que transforman comunidades y apoyalos con tu aporte
          </p>
          <Link to="/campaigns" className="hero-cta">
            Explorar campañas →
          </Link>
        </div>
      </section>

      {campaigns.length === 0 ? (
        <div className="home-state">
          <span className="state-icon">🏗️</span>
          <p>Todavía no hay campañas publicadas. ¡Sé el primero!</p>
          <button className="btn-primary" onClick={() => navigate('/my-campaigns/new')}>
            Crear campaña
          </button>
        </div>
      ) : (
        <div className="categories-container">
          {categoryNames.map((name) => (
            <CategoryRow key={name} title={name} campaigns={categorizedCampaigns[name]} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;