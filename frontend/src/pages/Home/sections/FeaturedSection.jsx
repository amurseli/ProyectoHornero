import { CampaignCard } from "$components/features"
import { FiTrendingUp } from "react-icons/fi"
import { Link } from "react-router-dom"
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

  const hero = campaigns[0]
  const sideCards = campaigns.slice(1, 5)

  return (
    <section ref={ref} className={`featured-section ${className}`}>
      <SectionHeader />

      <div className="featured-bento-grid">
        <div className="bento-item-hero">
          <CampaignCard campaign={hero} variant="standard" size="large" />
        </div>
        {sideCards.map(campaign => (
          <div key={campaign.id} className="bento-item-standard">
            <CampaignCard campaign={campaign} variant="standard" />
          </div>
        ))}
      </div>
    </section>
  )
}

function SectionHeader() {
  return (
    <div className="section-header">
      <div>
        <h2 className="section-title">
          <FiTrendingUp className="section-title-icon featured-icon" />
          Recomendados
        </h2>
        <p className="section-subtitle">Los mas populares de la comunidad</p>
      </div>
      <Link to="/explorar" className="section-see-all">Ver todo</Link>
    </div>
  )
}

export default FeaturedSection