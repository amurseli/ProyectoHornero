import { CampaignCard } from "$components/features"

function FeaturedSection({ campaigns, isLoading, currentSlide, onSlideChange }) {
  if (isLoading) {
    return (
      <section className="featured-section">
        <div className="featured-header">
          <h2 className="featured-title">
            <span className="featured-emoji">🚀</span>
            Proyectos Destacados
          </h2>
          <p className="featured-subtitle">Los más populares de la comunidad</p>
        </div>
        <div className="featured-loading">
          <div className="loading-spinner"></div>
          <p>Cargando proyectos...</p>
        </div>
      </section>
    )
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <section className="featured-section">
        <div className="featured-header">
          <h2 className="featured-title">
            <span className="featured-emoji">🚀</span>
            Proyectos Destacados
          </h2>
        </div>
        <div className="featured-empty">
          <p>No hay proyectos destacados en este momento</p>
        </div>
      </section>
    )
  }

  return (
    <section className="featured-section">
      <div className="featured-header">
        <h2 className="featured-title">
          <span className="featured-emoji">🚀</span>
          Proyectos Destacados
        </h2>
        <p className="featured-subtitle">Los más populares de la comunidad</p>
      </div>

      <div className="featured-grid">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} variant="featured" />
        ))}
      </div>

      <style>{`
        .featured-section {
          grid-column: 1 / -1;
          margin-bottom: 3rem;
        }

        .featured-header {
          margin-bottom: 2rem;
        }

        .featured-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--color-text-primary);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .featured-emoji {
          font-size: 2rem;
        }

        .featured-subtitle {
          font-size: 1rem;
          color: var(--color-text-muted);
        }

        .featured-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        @media (max-width: 640px) {
          .featured-grid {
            grid-template-columns: 1fr;
          }
        }

        .featured-loading,
        .featured-empty {
          padding: 3rem;
          text-align: center;
          color: var(--color-text-muted);
          background: var(--color-muted);
          border-radius: var(--radius-lg);
        }

        .loading-spinner {
          width: 3rem;
          height: 3rem;
          border: 3px solid var(--color-muted);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  )
}

export default FeaturedSection