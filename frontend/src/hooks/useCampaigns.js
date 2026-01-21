"use client"

import { useState, useEffect } from "react"
import { getFeaturedCampaigns, getRecentCampaigns } from "../utils/mockData"

export function useCampaigns() {
  const [featuredCampaigns, setFeaturedCampaigns] = useState([])
  const [recentCampaigns, setRecentCampaigns] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simular delay de API
    const timer = setTimeout(() => {
      setFeaturedCampaigns(getFeaturedCampaigns(4))
      setRecentCampaigns(getRecentCampaigns(6))
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return { featuredCampaigns, recentCampaigns, isLoading }
}
