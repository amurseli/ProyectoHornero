import { CampaignCard } from "$components/features"
import { FiTarget } from "react-icons/fi"
import { useFadeInOnScroll } from "../../../hooks/useFadeInOnScroll"

function NearGoalSection({ campaigns, isLoading }) {
  const { ref, className } = useFadeInOnScroll()

  if (isLoading) return null
  if (!campaigns || campaigns.length === 0) return null

  return (
    <section ref={ref} className={`near-goal-section ${className}`}>
      <div className="near-goal-header">
        <h2 className="near-goal-title">
          <FiTarget className="near-goal-icon" />
          Cerca de la meta
        </h2>
        <p className="near-goal-subtitle">Tu aporte puede ser el que las complete</p>
      </div>

      <div className="near-goal-list">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} variant="compact" />
        ))}
      </div>

      <style>{`
        .near-goal-section {
          min-width: 0;
        }

        .near-goal-header {
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid var(--color-muted);
        }

        .near-goal-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-text-primary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 0.25rem;
          line-height: 1.3;
        }

        .near-goal-icon {
          width: 1.125rem;
          height: 1.125rem;
          color: var(--color-accent);
          flex-shrink: 0;
        }

        .near-goal-subtitle {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1.4;
        }

        .near-goal-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
      `}</style>
    </section>
  )
}

export default NearGoalSection