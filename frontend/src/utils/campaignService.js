import { getMediaImageSrc } from './imageSources'

const API_URL = import.meta.env.VITE_API_URL || ""

function normalizeCampaign(campaign) {
  return {
    ...campaign,
    imageUrl: (() => {
      const primary = campaign.media?.find(m => m.isPrimary) || campaign.media?.[0]
      const imageSrc = getMediaImageSrc(primary)
      if (imageSrc) return imageSrc
      return campaign.imageUrl || "/crowdfunding-campaign.jpg"
    })(),
    goal: campaign.targetAmount || campaign.goal || 0,
    category: campaign.category?.name || campaign.category || "General",
    daysLeft: campaign.endDate
              ? Math.max(0, Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
              : 30,
    videoUrl: campaign.media?.find(m => m.mediaType === 'VIDEO')?.url || null,
  }
}

export const campaignService = {
  async getAllCampaigns() {
    const response = await fetch(`${API_URL}/api/campaigns`)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return data.map(normalizeCampaign)
  },

  async getHomeSections({
    spotlight = 6,
    featured = 6,
    endingSoon = 4,
    nearGoal = 4,
    recent = 8,
  } = {}) {
    const params = new URLSearchParams()
    params.set("spotlight", String(spotlight))
    params.set("featured", String(featured))
    params.set("endingSoon", String(endingSoon))
    params.set("nearGoal", String(nearGoal))
    params.set("recent", String(recent))

    const response = await fetch(`${API_URL}/api/campaigns/home?${params.toString()}`)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return {
      spotlight:  (data.spotlight  || []).map(normalizeCampaign),
      featured:   (data.featured   || []).map(normalizeCampaign),
      endingSoon: (data.endingSoon || []).map(normalizeCampaign),
      nearGoal:   (data.nearGoal   || []).map(normalizeCampaign),
      recent:     (data.recent     || []).map(normalizeCampaign),
    }
  },

  async getActiveCategories() {
    const response = await fetch(`${API_URL}/api/campaigns/categories/active`)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  },

  async getCategorySection(categoryId, limit = 6) {
    const params = new URLSearchParams({ limit: String(limit) })
    const response = await fetch(
      `${API_URL}/api/campaigns/home/category/${categoryId}?${params.toString()}`
    )
    if (response.status === 204) return []
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return data.map(normalizeCampaign)
  },

  async getCampaignById(id) {
    const response = await fetch(`${API_URL}/api/campaigns/${id}`, { credentials: 'include' })
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return normalizeCampaign(await response.json())
  },

  async getCategories() {
    const response = await fetch(`${API_URL}/api/campaigns/categories`)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  },

  async searchCampaigns({ search = "", categoryId = null, page = 1, size = 12, signal } = {}) {
    const params = new URLSearchParams()
    params.set("page", String(Math.max(0, page - 1)))
    params.set("size", String(size))
    if (search && search.trim() !== "") params.set("search", search.trim())
    if (categoryId != null) params.set("categoryId", String(categoryId))

    const response = await fetch(`${API_URL}/api/campaigns?${params.toString()}`, { signal })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    const content = Array.isArray(data.content) ? data.content : []
    return {
      campaigns: content.map(normalizeCampaign),
      totalElements: data.totalElements ?? content.length,
      totalPages: data.totalPages ?? 1,
      page: (data.number ?? 0) + 1,
      size: data.size ?? size,
    }
  },

  async browseCampaigns({ search = "", categoryId = null, status = null, sort = "recent", page = 1, size = 18, signal } = {}) {
    const params = new URLSearchParams()
    params.set("page", String(Math.max(0, page - 1)))
    params.set("size", String(size))
    params.set("sort", sort)
    if (search && search.trim() !== "") params.set("search", search.trim())
    if (categoryId != null) params.set("categoryId", String(categoryId))
    if (status != null) params.set("status", status)

    const response = await fetch(`${API_URL}/api/campaigns?${params.toString()}`, { signal })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    const content = Array.isArray(data.content) ? data.content : []
    return {
      campaigns: content.map(normalizeCampaign),
      totalElements: data.totalElements ?? content.length,
      totalPages: data.totalPages ?? 1,
      page: (data.number ?? 0) + 1,
      size: data.size ?? size,
    }
  },
}