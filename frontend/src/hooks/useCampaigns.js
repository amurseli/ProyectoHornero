"use client"

import { useState, useEffect } from "react"
import { campaignService } from "../utils/campaignService"

export function useCampaigns() {
  const [sections, setSections] = useState({
    featured: [],
    endingSoon: [],
    nearGoal: [],
    recent: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await campaignService.getHomeSections()
        if (!cancelled) setSections(data)
      } catch (error) {
        console.error('Error loading home sections:', error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return {
    featuredCampaigns:   sections.featured,
    endingSoonCampaigns: sections.endingSoon,
    nearGoalCampaigns:   sections.nearGoal,
    recentCampaigns:     sections.recent,
    isLoading,
  }
}