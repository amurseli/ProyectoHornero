import { CampaignCard } from "$components/features"
import { FiTarget } from "react-icons/fi"
import { useFadeInOnScroll } from "../../../hooks/useFadeInOnScroll"
import "./home-sections.css"

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
    </section>
  )
}

export default NearGoalSection