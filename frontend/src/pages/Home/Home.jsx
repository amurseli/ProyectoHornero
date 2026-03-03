"use client"

import { useState } from "react"
import { Footer } from "../../components/layout"
import { useCampaigns } from "../../hooks/useCampaigns"
import HeroSection from "./sections/HeroSection"
import FeaturedSection from "./sections/FeaturedSection"
import SpotlightSection from "./sections/SpotlightSection"
import CTASection from "./sections/CTASection"
import "./Home.css"

function Home() {
  const { featuredCampaigns, recentCampaigns, isLoading } = useCampaigns()
  const [activeTab, setActiveTab] = useState("all")
  const [currentSlide, setCurrentSlide] = useState(0)

  const filteredCampaigns =
    activeTab === "all" ? featuredCampaigns : featuredCampaigns.filter((c) => c.category?.toLowerCase() === activeTab)

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setCurrentSlide(0)
  }

  return (
    <div className="home">
      <main className="home-main">
        <HeroSection activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="container home-content">
          <div className="home-grid">
            <FeaturedSection
              campaigns={filteredCampaigns}
              isLoading={isLoading}
              currentSlide={currentSlide}
              onSlideChange={setCurrentSlide}
            />

            <SpotlightSection campaigns={recentCampaigns} isLoading={isLoading} />
          </div>
        </div>
      </main>

      <CTASection />
    </div>
  )
}

export default Home