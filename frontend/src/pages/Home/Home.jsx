"use client"

import { useState, useEffect } from "react"
import { useCampaigns } from "../../hooks/useCampaigns"
import { useCampaignSearch } from "../../hooks/useCampaignSearch"
import { campaignService } from "../../utils/campaignService"
import { SearchResultsGrid } from "../../components/features"
import HeroSection from "./sections/HeroSection"
import FeaturedSection from "./sections/FeaturedSection"
import EndingSoonSection from "./sections/EndingSoonSection"
import NearGoalSection from "./sections/NearGoalSection"
import SpotlightSection from "./sections/SpotlightSection"
import CategorySection from "./sections/CategorySection"
import CTASection from "./sections/CTASection"
import "./Home.css"

function Home() {
  const {
    spotlightCampaigns,
    featuredCampaigns,
    endingSoonCampaigns,
    nearGoalCampaigns,
    isLoading,
  } = useCampaigns()
  const search = useCampaignSearch()

  const [activeCategories, setActiveCategories] = useState([])

  useEffect(() => {
    campaignService.getActiveCategories()
      .then(setActiveCategories)
      .catch(() => {})
  }, [])

  return (
    <div className="home">
      <main className="home-main">
        <HeroSection search={search} />

        {search.hasActiveQuery ? (
          <div className="container home-content">
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
          </div>
        ) : (
          <>
            <div className="container home-content">
              <SpotlightSection campaigns={spotlightCampaigns} isLoading={isLoading} />
            </div>

            <div className="home-body">
              <div className="home-main-column">
                <FeaturedSection campaigns={featuredCampaigns} isLoading={isLoading} />
                <EndingSoonSection campaigns={endingSoonCampaigns} isLoading={isLoading} />
                {activeCategories.map(category => (
                  <CategorySection key={category.id} category={category} />
                ))}
              </div>
              <aside className="home-sidebar">
                <NearGoalSection campaigns={nearGoalCampaigns} isLoading={isLoading} />
              </aside>
            </div>
          </>
        )}
      </main>

      <CTASection />
    </div>
  )
}

export default Home