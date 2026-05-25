import { CampaignCard } from "$components/features"
import { FiTrendingUp } from "react-icons/fi"
import { useFadeInOnScroll } from "../../../hooks/useFadeInOnScroll"
import "./home-sections.css"

function FeaturedSection({ campaigns, isLoading }) {
  const { ref, className } = useFadeInOnScroll()

  if (isLoading) {
    return (
      <section ref={ref} className={`featured-section ${className}`}>
        <SectionHeader />
        <div className="section-loading">
          <div className="loading-spinner"></div>
          <p>Cargando proyectos...</p>
        </div>
      </section>
    )
  }

  if (!campaigns || campaigns.length === 0) return null

  return (
    <section ref={ref} className={`featured-section ${className}`}>
      <SectionHeader />
      
      <div className="featured-bento-grid">
        {campaigns.map((campaign, index) => (
          <div 
            key={campaign.id} 
            className={index === 0 ? "bento-item-hero" : "bento-item-standard"}
          >
            <CampaignCard 
              campaign={campaign} 
              variant={index === 0 ? "featured" : "standard"} 
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function SectionHeader() {
  return (
    <div className="section-header">
      <h2 className="section-title">
        <FiTrendingUp className="section-title-icon featured-icon" />
        Recomendados
      </h2>
      <p className="section-subtitle">Los mas populares de la comunidad</p>
    </div>
  )
}

export default FeaturedSection