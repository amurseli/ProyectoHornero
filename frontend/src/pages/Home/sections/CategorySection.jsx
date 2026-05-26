import { useState, useEffect, useRef } from "react"
import { CampaignCard } from "$components/features"
import { FiTag, FiArrowRight } from "react-icons/fi"
import { campaignService } from "../../../utils/campaignService"
import "./home-sections.css"

function CategorySection({ category }) {
  const [campaigns, setCampaigns] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)
  const fetchedRef = useRef(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fetchedRef.current) {
          fetchedRef.current = true
          setIsVisible(true)
          observer.disconnect()
          fetchCampaigns()
        }
      },
      { rootMargin: "300px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [category.id])

  const fetchCampaigns = async () => {
    setIsLoading(true)
    try {
      const data = await campaignService.getCategorySection(category.id)
      setCampaigns(data || [])
    } catch {
      setCampaigns([])
    } finally {
      setIsLoading(false)
    }
  }

  if (campaigns !== null && campaigns.length === 0) return null

  return (
    <section
      ref={sectionRef}
      className={`category-section ${isVisible ? "category-section--visible" : ""}`}
    >
      <div className="category-section-header">
        <div className="category-section-title-wrap">
          <FiTag className="category-section-icon" />
          <h2 className="category-section-title">{category.name}</h2>
        </div>
        <a
          href={`/campaigns?categoryId=${category.id}`}
          className="category-section-link"
        >
          Ver todos
          <FiArrowRight className="category-section-link-icon" />
        </a>
      </div>

      {isLoading && (
        <div className="category-grid">
          {[0, 1, 2].map(i => (
            <div key={i} className="category-skeleton" />
          ))}
        </div>
      )}

      {campaigns && campaigns.length > 0 && (
        <div className="category-grid">
          {campaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} variant="standard" />
          ))}
        </div>
      )}
    </section>
  )
}

export default CategorySection