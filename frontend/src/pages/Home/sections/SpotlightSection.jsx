import { useState, useRef, useEffect, useCallback } from "react"
import { CampaignCard } from "$components/features"
import { FiStar, FiChevronLeft, FiChevronRight } from "react-icons/fi"
import { useFadeInOnScroll } from "../../../hooks/useFadeInOnScroll"
import "./home-sections.css"

function SpotlightSection({ campaigns, isLoading }) {
  const { ref, className } = useFadeInOnScroll()
  const trackRef = useRef(null)
  const containerRef = useRef(null)
  const [scrollPos, setScrollPos] = useState(0)
  const [maxScroll, setMaxScroll] = useState(0)

  const updateBounds = useCallback(() => {
    const track = trackRef.current
    const container = containerRef.current
    if (!track || !container) return
    setMaxScroll(Math.max(0, track.scrollWidth - container.clientWidth))
  }, [])

  useEffect(() => {
    updateBounds()
    window.addEventListener("resize", updateBounds)
    return () => window.removeEventListener("resize", updateBounds)
  }, [campaigns, updateBounds])

  const scroll = (direction) => {
    const container = containerRef.current
    if (!container) return
    const step = container.clientWidth * 0.5
    const next = direction === "left"
      ? Math.max(0, scrollPos - step)
      : Math.min(maxScroll, scrollPos + step)
    setScrollPos(next)
  }

  if (isLoading) return null
  if (!campaigns || campaigns.length === 0) return null

  return (
    <section ref={ref} className={`spotlight-section ${className}`}>
      <div className="spotlight-header">
        <div className="spotlight-header-content">
          <h2 className="section-title">
            <FiStar className="section-title-icon spotlight-icon" />
            Destacados
          </h2>
          <p className="section-subtitle">Proyectos que no te podes perder</p>
        </div>

        <div className="spotlight-nav">
          <button
            className="spotlight-nav-btn"
            onClick={() => scroll("left")}
            disabled={scrollPos <= 0}
            aria-label="Anterior"
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            className="spotlight-nav-btn"
            onClick={() => scroll("right")}
            disabled={scrollPos >= maxScroll}
            aria-label="Siguiente"
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="spotlight-carousel" ref={containerRef}>
        <div
          className="spotlight-track"
          ref={trackRef}
          style={{ transform: `translateX(-${scrollPos}px)` }}
        >
          {campaigns.map((campaign) => (
            <div className="spotlight-item" key={campaign.id}>
              <CampaignCard campaign={campaign} variant="featured" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SpotlightSection