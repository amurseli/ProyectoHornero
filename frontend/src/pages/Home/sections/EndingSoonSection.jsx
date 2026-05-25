import { CampaignCard } from "$components/features"
import { FiZap } from "react-icons/fi"
import { useFadeInOnScroll } from "../../../hooks/useFadeInOnScroll"

function EndingSoonSection({ campaigns, isLoading }) {
  const { ref, className } = useFadeInOnScroll()

  if (isLoading) return null
  if (!campaigns || campaigns.length === 0) return null

  return (
    <section ref={ref} className={`ending-soon-section ${className}`}>
      <div className="ending-soon-header">
        <h2 className="ending-soon-title">
          <FiZap className="ending-soon-icon" />
          Por terminar
        </h2>
        <p className="ending-soon-subtitle">Ultimos dias para sumarte antes de que cierren</p>
      </div>

      <div className="ending-soon-grid">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} variant="featured" />
        ))}
      </div>

      <style>{`
        .ending-soon-section { min-width: 0; }

        .ending-soon-header {
          margin-bottom: 1.5rem;
        }

        .ending-soon-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text-primary);
          display: flex;
          align-items: center;
          gap: 0.625rem;
          margin: 0 0 0.25rem;
          line-height: 1.3;
        }

        .ending-soon-icon {
          width: 1.375rem;
          height: 1.375rem;
          color: var(--color-primary-light);
          flex-shrink: 0;
        }

        .ending-soon-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin: 0;
        }

        .ending-soon-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1.25rem;
        }

        @media (max-width: 1024px) {
          .ending-soon-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 640px) {
          .ending-soon-grid { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </section>
  )
}

export default EndingSoonSection