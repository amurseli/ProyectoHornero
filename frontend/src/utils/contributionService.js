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

  process: (contributionId, formData) => {
    if (!formData) return Promise.reject(new Error('Datos de pago inválidos'))
    const isWallet = formData.paymentType === 'wallet_purchase'
    const body = isWallet
      ? { paymentType: 'wallet_purchase', paymentId: formData.paymentId }
      : {
          paymentType: formData.payment_method_id,
          token: formData.token,
          paymentMethodId: formData.payment_method_id,
          issuerId: formData.issuer_id,
          installments: formData.installments,
          payerEmail: formData.payer?.email,
          identificationType: formData.payer?.identification?.type,
          identificationNumber: formData.payer?.identification?.number,
        }
    return request(`/api/payments/contributions/${contributionId}/process`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  getStatus: (contributionId) =>
    request(`/api/payments/contributions/${contributionId}`),

  getCampaignSummary: (campaignId) =>
    request(`/api/payments/campaigns/${campaignId}/summary`),
}
