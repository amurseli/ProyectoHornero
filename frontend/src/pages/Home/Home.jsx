"use client"

import { useState, useEffect } from "react"
import { useCampaigns } from "../../hooks/useCampaigns"
import { useHeroSearch } from "../../hooks/useHeroSearch"
import { campaignService } from "../../utils/campaignService"
import HeroSection from "./sections/HeroSection"
import TransactionsSection from "./sections/TransactionsSection"
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
  const search = useHeroSearch()

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

        <div className="container home-content">
          <SpotlightSection campaigns={spotlightCampaigns} isLoading={isLoading} />
        </div>

        <div className="container home-content home-content--wide">
          <FeaturedSection campaigns={featuredCampaigns} isLoading={isLoading} />
        </div>

        <div className="container home-content home-content--wide">
          <TransactionsSection />
        </div>

        <div className="home-body">
          <div className="home-main-column">
            <EndingSoonSection campaigns={endingSoonCampaigns} isLoading={isLoading} />
          </div>
          <aside className="home-sidebar">
            <NearGoalSection campaigns={nearGoalCampaigns} isLoading={isLoading} />
          </aside>
        </div>

        <div className="container home-content home-content--wide">
          {activeCategories.map(category => (
            <CategorySection key={category.id} category={category} />
          ))}
        </div>
      </main>

      <CTASection />
    </div>
  )
}

export default Home