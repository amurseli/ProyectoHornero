import { CampaignCard } from "$components/features"
import { FiClock } from "react-icons/fi"
import { useFadeInOnScroll } from "../../../hooks/useFadeInOnScroll"

function SpotlightSection({ campaigns, isLoading }) {
  const { ref, className } = useFadeInOnScroll()

  if (isLoading) return null
  if (!campaigns || campaigns.length === 0) return null

  return (
    <section ref={ref} className={`spotlight-section ${className}`}>
      <div className="spotlight-header">
        <h2 className="spotlight-title">
          <FiClock className="spotlight-icon" />
          Recientes
        </h2>
        <p className="spotlight-subtitle">Recien lanzados en la plataforma</p>
      </div>

      <div className="spotlight-scroller">
        <div className="spotlight-track">
          {campaigns.map((campaign) => (
            <div className="spotlight-item" key={campaign.id}>
              <CampaignCard campaign={campaign} variant="featured" />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .spotlight-section {
          min-width: 0;
        }

        .spotlight-header {
          margin-bottom: 1.5rem;
        }

        .spotlight-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text-primary);
          display: flex;
          align-items: center;
          gap: 0.625rem;
          margin: 0 0 0.25rem;
          line-height: 1.3;
        }

        .spotlight-icon {
          width: 1.375rem;
          height: 1.375rem;
          color: var(--color-secondary-dark);
          flex-shrink: 0;
        }

        .spotlight-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin: 0;
        }

        .spotlight-scroller {
          padding-bottom: 0.5rem;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: var(--color-border) transparent;
        }

        .spotlight-scroller::-webkit-scrollbar { height: 6px; }
        .spotlight-scroller::-webkit-scrollbar-track { background: transparent; }
        .spotlight-scroller::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 3px;
        }
        .spotlight-scroller::-webkit-scrollbar-thumb:hover {
          background: var(--color-muted-foreground);
        }

        .spotlight-track {
          display: flex;
          gap: 1.25rem;
          padding: 2px;
        }

        .spotlight-item {
          flex: 0 0 260px;
          scroll-snap-align: start;
        }

        @media (max-width: 640px) {
          .spotlight-item { flex: 0 0 85vw; }
        }
      `}</style>
    </section>
  )
}

export default SpotlightSection