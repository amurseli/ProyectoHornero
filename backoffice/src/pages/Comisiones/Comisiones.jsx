import { useEffect, useState } from 'react'
import { Button } from '../../components'
import api from '../../utils/api'
import { formatDate } from '../../utils/datetime'
import './Comisiones.css'

// Las tasas viajan como fracción (0.05) entre back y payments; pero se muestran y editan como porcentaje (5) 
function toPercentString(rate) {
  if (rate === null || rate === undefined) return ''
  return String(Number(rate) * 100)
}

function toRateNumber(percentString) {
  const percent = Number(percentString)
  return Number.isFinite(percent) ? percent / 100 : NaN
}

export default function ComisionesPage() {
  const [platformPercent, setPlatformPercent] = useState('')
  const [providerPercent, setProviderPercent] = useState('')
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const fetchConfig = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get('/api/admin/fee-config')
      setCurrent(data)
      setPlatformPercent(toPercentString(data.platformRate))
      setProviderPercent(toPercentString(data.providerRate))
    } catch (err) {
      setError(err.message || 'Error al cargar la configuración de comisiones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const platformRate = toRateNumber(platformPercent)
    const providerRate = toRateNumber(providerPercent)

    if (!Number.isFinite(platformRate) || !Number.isFinite(providerRate)) {
      setError('Ingresá valores numéricos válidos para ambos porcentajes')
      return
    }

    setSaving(true)
    try {
      const updated = await api.put('/api/admin/fee-config', { platformRate, providerRate })
      setCurrent(updated)
      setSuccess('Comisiones actualizadas correctamente')
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la configuración de comisiones')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="comisiones-page">
      <div className="cf-container">
        <div className="cf-header">
          <h1>Comisiones</h1>
          <p>
            Definí el porcentaje que se descuenta del monto recaudado por comisión de la
            plataforma y por comisión del proveedor de pagos (Mercado Pago) al transferirle
            el dinero al creador de una campaña exitosa.
          </p>
        </div>

        {error && <div className="cf-error">{error}</div>}
        {success && <div className="cf-success">{success}</div>}

        {loading ? (
          <div className="cf-loading">Cargando configuración...</div>
        ) : (
          <form className="cf-form" onSubmit={handleSubmit}>
            <div className="cf-field">
              <label htmlFor="platformPercent">Comisión de la plataforma (%)</label>
              <input
                id="platformPercent"
                type="number"
                step="0.01"
                min="0"
                max="99"
                value={platformPercent}
                onChange={(event) => setPlatformPercent(event.target.value)}
                required
              />
            </div>

            <div className="cf-field">
              <label htmlFor="providerPercent">Comisión de Mercado Pago (%)</label>
              <input
                id="providerPercent"
                type="number"
                step="0.01"
                min="0"
                max="99"
                value={providerPercent}
                onChange={(event) => setProviderPercent(event.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>

            {current && (
              <p className="cf-meta">
                Última actualización: {formatDate(current.createdAt, '—')}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
