const API_URL = import.meta.env.VITE_API_URL || ""

function normalizeCampaign(campaign) {
  return {
    ...campaign,
    imageUrl: (() => {
      const primary = campaign.media?.find(m => m.isPrimary) || campaign.media?.[0]
      if (primary?.base64Data) return `data:image/jpeg;base64,${primary.base64Data}`
      if (primary?.url) return primary.url
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
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.map(normalizeCampaign)
  },

  async getFeaturedCampaigns(limit = 4) {
    const campaigns = await this.getAllCampaigns()
    return campaigns
      .filter((c) => c.status === "CROWDFUNDING")
      .sort((a, b) => {
        const pA = a.goal > 0 ? a.currentAmount / a.goal : 0
        const pB = b.goal > 0 ? b.currentAmount / b.goal : 0
        return pB - pA
      })
      .slice(0, limit)
  },
  
  async getRecentCampaigns(limit = 6) {
    const campaigns = await this.getAllCampaigns()
    return campaigns
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit)
  },

  async getCampaignById(id) {
    const response = await fetch(`${API_URL}/api/campaigns/${id}`, { credentials: 'include' })
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return normalizeCampaign(await response.json())
  },
}