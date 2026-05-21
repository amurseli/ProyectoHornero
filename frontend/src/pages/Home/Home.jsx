"use client"

import { useState } from "react"
import { useCampaigns } from "../../hooks/useCampaigns"
import { useCampaignSearch } from "../../hooks/useCampaignSearch"
import { SearchResultsGrid } from "../../components/features"
import HeroSection from "./sections/HeroSection"
import FeaturedSection from "./sections/FeaturedSection"
import SpotlightSection from "./sections/SpotlightSection"
import CTASection from "./sections/CTASection"
import "./Home.css"

function Home() {
  const { featuredCampaigns, recentCampaigns, isLoading } = useCampaigns()
  const search = useCampaignSearch()
  const [currentSlide, setCurrentSlide] = useState(0)

  return (
    <div className="home">
      <main className="home-main">
        <HeroSection search={search} />

        <div className="container home-content">
          {search.hasActiveQuery ? (
            <SearchResultsGrid
              results={search.results}
              page={search.page}
              totalPages={search.totalPages}
              totalElements={search.totalElements}
              isLoading={search.isLoading}
              query={search.query}
              selectedCategory={search.selectedCategory}
              onPrev={search.goPrev}
              onNext={search.goNext}
            />
          ) : (
            <div className="home-grid">
              <FeaturedSection
                campaigns={featuredCampaigns}
                isLoading={isLoading}
                currentSlide={currentSlide}
                onSlideChange={setCurrentSlide}
              />

              <SpotlightSection campaigns={recentCampaigns} isLoading={isLoading} />
            </div>
          )}
        </div>
      </main>

      <CTASection />
    </div>
  )
}

export default Home
