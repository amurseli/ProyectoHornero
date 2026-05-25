import { useState, useRef, useEffect, useCallback } from "react"
import { CampaignCard } from "$components/features"
import { FiClock, FiChevronLeft, FiChevronRight } from "react-icons/fi"
import { useFadeInOnScroll } from "../../../hooks/useFadeInOnScroll"
import "./home-sections.css"

function SpotlightSection({ campaigns, isLoading }) {
  const { ref, className } = useFadeInOnScroll()
  const trackRef = useRef(null)
  const [scrollPos, setScrollPos] = useState(0)
  const [maxScroll, setMaxScroll] = useState(0)

  const ITEM_WIDTH = 280
  const GAP = 20

  const updateBounds = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const container = track.parentElement
    setMaxScroll(Math.max(0, track.scrollWidth - container.clientWidth))
  }, [])

  useEffect(() => {
    updateBounds()
    window.addEventListener("resize", updateBounds)
    return () => window.removeEventListener("resize", updateBounds)
  }, [campaigns, updateBounds])

  const scroll = (direction) => {
    const step = (ITEM_WIDTH + GAP) * 2
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
            <FiClock className="section-title-icon spotlight-icon" />
            Recientes
          </h2>
          <p className="section-subtitle">Recien lanzados en la plataforma</p>
        </div>
        
        <div className="spotlight-nav">
          <button 
            className="spotlight-nav-btn"
            onClick={() => scroll("left")}
            disabled={scrollPos <= 0}
            aria-label="Anterior"
          >
            <FiChevronLeft size={18} />
          </button>
          <button 
            className="spotlight-nav-btn"
            onClick={() => scroll("right")}
            disabled={scrollPos >= maxScroll}
            aria-label="Siguiente"
          >
            <FiChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="spotlight-carousel">
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