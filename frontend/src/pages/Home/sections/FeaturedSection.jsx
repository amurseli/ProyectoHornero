"use client"

import { Rocket, ChevronLeft, ChevronRight } from "lucide-react"
import { CampaignCard } from "$components/features"

function FeaturedSection({ campaigns, isLoading, currentSlide, onSlideChange }) {
  const nextSlide = () => {
    onSlideChange((currentSlide + 1) % campaigns.length)
  }

  const prevSlide = () => {
    onSlideChange((currentSlide - 1 + campaigns.length) % campaigns.length)
  }

  if (isLoading) {
    return (
      <div className="featured-section">
        <h2 className="featured-title">
          <Rocket className="featured-icon" />
          Proyectos Destacados
        </h2>
        <div className="featured-loading">Cargando...</div>
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="featured-section">
        <h2 className="featured-title">
          <Rocket className="featured-icon" />
          Proyectos Destacados
        </h2>
        <div className="featured-empty">No hay campañas en esta categoría</div>
      </div>
    )
  }

  return (
    <div className="featured-section">
      <div className="featured-header">
        <h2 className="featured-title">
          <Rocket className="featured-icon" />
          Proyectos Destacados
        </h2>
        {campaigns.length > 1 && (
          <div className="featured-controls">
            <button onClick={prevSlide} className="featured-control-btn" aria-label="Previous campaign">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextSlide} className="featured-control-btn" aria-label="Next campaign">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="featured-carousel">
        <div className="featured-carousel-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="featured-carousel-slide">
              <CampaignCard campaign={campaign} variant="featured" />
            </div>
          ))}
        </div>

        {campaigns.length > 1 && (
          <div className="featured-dots">
            {campaigns.map((_, index) => (
              <button
                key={index}
                onClick={() => onSlideChange(index)}
                className={`featured-dot ${index === currentSlide ? "featured-dot-active" : ""}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .featured-section {
          /* Estilos en el componente padre */
        }

        .featured-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .featured-title {
          font-size: 1.5rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .featured-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: var(--color-primary);
        }

        .featured-controls {
          display: flex;
          gap: 0.5rem;
        }

        .featured-control-btn {
          padding: 0.5rem;
          border-radius: var(--radius-full);
          background: white;
          border: 1px solid var(--color-border);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .featured-control-btn:hover {
          background: var(--color-muted);
        }

        .featured-carousel {
          position: relative;
          overflow: hidden;
          border-radius: var(--radius-xl);
        }

        .featured-carousel-track {
          display: flex;
          transition: transform 0.5s ease-in-out;
        }

        .featured-carousel-slide {
          width: 100%;
          flex-shrink: 0;
        }

        .featured-dots {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .featured-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: var(--radius-full);
          background: var(--color-border);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .featured-dot:hover {
          background: var(--color-muted-foreground);
        }

        .featured-dot-active {
          width: 2rem;
          background: var(--color-primary);
        }

        .featured-loading,
        .featured-empty {
          padding: 3rem;
          text-align: center;
          color: var(--color-muted-foreground);
        }
      `}</style>
    </div>
  )
}

export default FeaturedSection
