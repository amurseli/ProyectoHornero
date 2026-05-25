import { CampaignCard } from "$components/features"
import { FiClock } from "react-icons/fi"
import { useFadeInOnScroll } from "../../../hooks/useFadeInOnScroll"
import "./home-sections.css"

function EndingSoonSection({ campaigns, isLoading }) {
  const { ref, className } = useFadeInOnScroll()

  if (isLoading) {
    return (
      <section ref={ref} className={`ending-soon-section ${className}`}>
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
    <section ref={ref} className={`ending-soon-section ${className}`}>
      <SectionHeader />
      
      {/* 🚀 Grilla continua unificada idéntica a la de recomendados */}
      <div className="ending-soon-bento-grid">
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
        <FiClock className="section-title-icon ending-soon-icon" />
        Por terminar
      </h2>
      <p className="section-subtitle">Últimos días para sumarte antes de que cierren</p>
    </div>
  )
}

export default EndingSoonSection