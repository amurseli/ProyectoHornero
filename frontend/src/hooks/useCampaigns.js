"use client"

import { useState, useEffect } from "react"
import { campaignService } from "../utils/campaignService"

export function useCampaigns() {
  const [featuredCampaigns, setFeaturedCampaigns] = useState([])
  const [recentCampaigns, setRecentCampaigns] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const [featured, recent] = await Promise.all([
          campaignService.getFeaturedCampaigns(4),
          campaignService.getRecentCampaigns(6)
        ])
        setFeaturedCampaigns(featured)
        setRecentCampaigns(recent)
      } catch (error) {
        console.error('Error loading campaigns:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCampaigns()
  }, [])

  return { featuredCampaigns, recentCampaigns, isLoading }
}