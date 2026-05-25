const PAYMENTS_URL = import.meta.env.VITE_PAYMENTS_URL || 'http://localhost:8081'

async function request(path, options = {}) {
  const res = await fetch(`${PAYMENTS_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Error ${res.status}`)
  }
  return res.json()
}

export const contributionService = {
  initiate: (campaignId, amount, rewardId = null) =>
    request('/api/payments/contributions/initiate', {
      method: 'POST',
      body: JSON.stringify({ campaignId, amount, rewardId }),
    }),

  process: (contributionId, formData) =>
    request(`/api/payments/contributions/${contributionId}/process`, {
      method: 'POST',
      body: JSON.stringify({
        token: formData.token,
        paymentMethodId: formData.payment_method_id,
        issuerId: formData.issuer_id,
        installments: formData.installments,
        payerEmail: formData.payer.email,
        identificationType: formData.payer.identification.type,
        identificationNumber: formData.payer.identification.number,
      }),
    }),

  getStatus: (contributionId) =>
    request(`/api/payments/contributions/${contributionId}`),

  getCampaignSummary: (campaignId) =>
    request(`/api/payments/campaigns/${campaignId}/summary`),
}
