import { CampaignCard } from "$components/features"
import { FiClock } from "react-icons/fi"

function SpotlightSection({ campaigns, isLoading }) {
  if (isLoading) {
    return (
      <aside className="spotlight-section">
        <div className="spotlight-header">
          <h2 className="spotlight-title">
            <FiClock className="spotlight-icon" />
            Recientes
          </h2>
          <p className="spotlight-subtitle">Recién lanzados</p>
        </div>
        <div className="spotlight-loading">
          <div className="loading-spinner"></div>
          <p>Cargando...</p>
        </div>
      </aside>
    )
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <aside className="spotlight-section">
        <div className="spotlight-header">
          <h2 className="spotlight-title">
            <FiClock className="spotlight-icon" />
            Recientes
          </h2>
        </div>
        <div className="spotlight-empty">
          <p>No hay proyectos recientes</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="spotlight-section">
      <div className="spotlight-header">
        <h2 className="spotlight-title">
          <FiClock className="spotlight-icon" />
          Recientes
        </h2>
        <p className="spotlight-subtitle">Recién lanzados</p>
      </div>

      <div className="spotlight-list">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} variant="compact" />
        ))}
      </div>

      <style>{`
        .spotlight-section {
          min-width: 0;
        }

        .spotlight-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid var(--color-muted);
        }

        .spotlight-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text-primary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .spotlight-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: var(--color-secondary);
        }

        .spotlight-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin-top: 0.25rem;
        }

        .spotlight-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .spotlight-loading,
        .spotlight-empty {
          padding: 2rem;
          text-align: center;
          color: var(--color-text-muted);
          background: var(--color-muted);
          border-radius: var(--radius-md);
        }

        .loading-spinner {
          width: 2.5rem;
          height: 2.5rem;
          border: 3px solid var(--color-muted);
          border-top-color: var(--color-secondary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 0.75rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .spotlight-section {
            grid-column: 1 / -1;
            margin-top: 2rem;
          }

          .spotlight-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
          }
        }
      `}</style>
    </aside>
  )
}

export default SpotlightSection