import { CampaignCard } from "$components/features"
import { FiZap } from "react-icons/fi"
import { useFadeInOnScroll } from "../../../hooks/useFadeInOnScroll"
import "./home-sections.css"

function EndingSoonSection({ campaigns, isLoading }) {
  const { ref, className } = useFadeInOnScroll()

  if (isLoading) return null
  if (!campaigns || campaigns.length === 0) return null

  const [hero, ...rest] = campaigns

  return (
    <section ref={ref} className={`ending-soon-section ${className}`}>
      <div className="section-header">
        <h2 className="section-title">
          <FiZap className="section-title-icon ending-soon-icon" />
          Por terminar
        </h2>
        <p className="section-subtitle">Ultimos dias para sumarte antes de que cierren</p>
      </div>

      {hero && (
        <div className="ending-soon-hero">
          <CampaignCard campaign={hero} variant="featured" />
        </div>
      )}

      {rest.length > 0 && (
        <div className="ending-soon-grid">
          {rest.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} variant="featured" />
          ))}
        </div>
      )}
    </section>
  )
}

export default EndingSoonSection