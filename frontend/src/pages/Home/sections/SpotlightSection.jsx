import { CampaignCard } from "$components/features"

function SpotlightSection({ campaigns, isLoading }) {
  if (isLoading) {
    return (
      <div className="spotlight-section">
        <div className="spotlight-header">
          <h2 className="spotlight-title">
            <span className="spotlight-emoji">🔦</span>
            Spotlight
          </h2>
          <p className="spotlight-subtitle">Campañas recientemente lanzadas</p>
        </div>
        <div className="spotlight-loading">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="spotlight-section">
      <div className="spotlight-header">
        <h2 className="spotlight-title">
          <span className="spotlight-emoji">🔦</span>
          Spotlight
        </h2>
        <p className="spotlight-subtitle">Campañas recientemente lanzadas</p>
      </div>

      <div className="spotlight-list">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} variant="spotlight" />
        ))}
      </div>

      <style>{`
        .spotlight-section {
          /* Estilos en el componente padre */
        }

        .spotlight-header {
          margin-bottom: 1.5rem;
        }

        .spotlight-title {
          font-size: 1.25rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spotlight-emoji {
          font-size: 1.5rem;
        }

        .spotlight-subtitle {
          font-size: 0.875rem;
          color: var(--color-muted-foreground);
          margin-top: 0.25rem;
        }

        .spotlight-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .spotlight-loading {
          padding: 2rem;
          text-align: center;
          color: var(--color-muted-foreground);
        }
      `}</style>
    </div>
  )
}

export default SpotlightSection
