"use client"

import { useState, useEffect } from "react"
import api from "../utils/api/api"

// Tasas de comisión vigentes (plataforma + Mercado Pago), usadas para estimar
// cuánto va a recibir el creador al crear/editar una campaña.
export function useFeeRates() {
  const [feeRates, setFeeRates] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    api.get('/api/campaigns/fee-rates')
      .then(data => {
        if (cancelled) return
        setFeeRates({
          platformRate: Number(data.platformRate),
          providerRate: Number(data.providerRate),
        })
      })
      .catch(error => {
        console.error('Error loading fee rates:', error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { feeRates, loading }
}
