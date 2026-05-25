import { CampaignCard } from "$components/features"
import { FiTrendingUp } from "react-icons/fi"
import { useFadeInOnScroll } from "../../../hooks/useFadeInOnScroll"

function FeaturedSection({ campaigns, isLoading }) {
  const { ref, className } = useFadeInOnScroll()

  if (isLoading) {
    return (
      <section ref={ref} className={`featured-section ${className}`}>
        <SectionHeader />
        <div className="featured-loading">
          <div className="loading-spinner"></div>
          <p>Cargando proyectos...</p>
        </div>
        <style>{styles}</style>
      </section>
    )
  }

  if (!campaigns || campaigns.length === 0) {
    return null
  }

  return (
    <section ref={ref} className={`featured-section ${className}`}>
      <SectionHeader />
      <div className="featured-grid">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} variant="featured" />
        ))}
      </div>
      <style>{styles}</style>
    </section>
  )
}

function SectionHeader() {
  return (
    <div className="featured-header">
      <h2 className="featured-title">
        <FiTrendingUp className="featured-icon" />
        Recomendados
      </h2>
      <p className="featured-subtitle">Los mas populares de la comunidad</p>
    </div>
  )
}

const styles = `
  .featured-section { min-width: 0; }

  .featured-header {
    margin-bottom: 1.5rem;
  }

  .featured-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    gap: 0.625rem;
    margin: 0 0 0.25rem;
    line-height: 1.3;
  }

  .featured-icon {
    width: 1.375rem;
    height: 1.375rem;
    color: var(--color-primary);
    flex-shrink: 0;
  }

  .featured-subtitle {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin: 0;
  }

  .featured-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.25rem;
  }

  @media (max-width: 1024px) {
    .featured-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (max-width: 640px) {
    .featured-grid { grid-template-columns: minmax(0, 1fr); }
  }

  .featured-loading {
    padding: 3rem;
    text-align: center;
    color: var(--color-text-muted);
    background: var(--color-muted);
    border-radius: var(--radius-lg);
  }

  .loading-spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid var(--color-muted);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
`

export default FeaturedSection