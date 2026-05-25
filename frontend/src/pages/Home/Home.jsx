"use client"

import { useCampaigns } from "../../hooks/useCampaigns"
import { useCampaignSearch } from "../../hooks/useCampaignSearch"
import { SearchResultsGrid } from "../../components/features"
import HeroSection from "./sections/HeroSection"
import FeaturedSection from "./sections/FeaturedSection"
import EndingSoonSection from "./sections/EndingSoonSection"
import NearGoalSection from "./sections/NearGoalSection"
import SpotlightSection from "./sections/SpotlightSection"
import CTASection from "./sections/CTASection"
import "./Home.css"

function Home() {
  const {
    featuredCampaigns,
    endingSoonCampaigns,
    nearGoalCampaigns,
    recentCampaigns,
    isLoading,
  } = useCampaigns()
  const search = useCampaignSearch()

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
            <>
              {/* Carrusel full-width - FUERA del grid */}
              <SpotlightSection campaigns={recentCampaigns} isLoading={isLoading} />

              {/* Grid principal */}
              <div className="home-grid">
                <div className="home-main-column">
                  <FeaturedSection campaigns={featuredCampaigns} isLoading={isLoading} />
                  <EndingSoonSection campaigns={endingSoonCampaigns} isLoading={isLoading} />
                </div>

                <aside className="home-sidebar">
                  <NearGoalSection campaigns={nearGoalCampaigns} isLoading={isLoading} />
                </aside>
              </div>
            </>
          )}
        </div>
      </main>

      <CTASection />
    </div>
  )
}

export default Home