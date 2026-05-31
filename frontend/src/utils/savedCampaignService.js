import api from '$utils/api/api'

export const savedCampaignService = {
  listSavedCampaigns() {
    return api.get('/api/users/me/saved-campaigns')
  },

  getSavedStatus(campaignId) {
    return api.get(`/api/users/me/saved-campaigns/${campaignId}`)
  },

  saveCampaign(campaignId) {
    return api.post(`/api/users/me/saved-campaigns/${campaignId}`, {})
  },

  unsaveCampaign(campaignId) {
    return api.delete(`/api/users/me/saved-campaigns/${campaignId}`)
  },
}

export default savedCampaignService
