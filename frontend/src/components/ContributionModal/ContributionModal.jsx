import { useState, useRef } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import { contributionService } from '$utils/contributionService'
import { Button } from '$components/ui'
import { X, CheckCircle, XCircle, Loader } from 'lucide-react'
import './ContributionModal.css'

export default function ContributionModal({ campaignId, initialAmount = 1, onClose }) {
  const [step, setStep] = useState('amount')
  const [amount, setAmount] = useState(Number(initialAmount) || 1)
  const [contributionId, setContributionId] = useState(null)
  const [mpReady, setMpReady] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const mpInitialized = useRef(false)

  async function handleAmountSubmit(e) {
    e.preventDefault()
    if (amount < 1) return
    setLoading(true)
    setError(null)
    try {
      const data = await contributionService.initiate(campaignId, amount)
      if (!mpInitialized.current) {
        initMercadoPago(data.publicKey, { locale: 'es-AR' })
        mpInitialized.current = true
      }
      setContributionId(data.contributionId)
      setAmount(data.amount)
      setMpReady(true)
      setStep('payment')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePaymentSubmit({ formData }) {
    try {
      const data = await contributionService.process(contributionId, formData)
      setResult(data)
      setStep('result')
    } catch (err) {
      setResult({ status: 'REJECTED', error: err.message })
      setStep('result')
    }
  }

  function handleRetry() {
    setStep('amount')
    setResult(null)
    setContributionId(null)
    setMpReady(false)
    mpInitialized.current = false
    setError(null)
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  const amountFormatted = `ARS $${Number(amount).toLocaleString('es-AR')}`

  return (
    <div className="cm-overlay" onClick={handleOverlayClick}>
      <div className="cm-modal" role="dialog" aria-modal="true">
        <button className="cm-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        {step === 'amount' && (
          <div className="cm-step">
            <h2 className="cm-title">Hacer una contribución</h2>
            <p className="cm-subtitle">Ingresá el monto que querés aportar a esta campaña.</p>
            <form onSubmit={handleAmountSubmit}>
              <div className="cm-amount-row">
                <span className="cm-amount-prefix">ARS $</span>
                <input
                  type="number"
                  className="cm-amount-input"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={1}
                  step="1"
                  required
                  autoFocus
                />
              </div>
              {error && <p className="cm-error-msg">{error}</p>}
              <Button type="submit" variant="primary" className="cm-btn" disabled={loading}>
                {loading
                  ? <><Loader size={14} className="cm-spin" /> Iniciando...</>
                  : 'Continuar'}
              </Button>
            </form>
          </div>
        )}

        {step === 'payment' && mpReady && (
          <div className="cm-step">
            <h2 className="cm-title">Datos de pago</h2>
            <p className="cm-subtitle">
              Estás contribuyendo <strong>{amountFormatted}</strong>
            </p>
            <Payment
              initialization={{ amount }}
              customization={{
                paymentMethods: { creditCard: 'all', debitCard: 'all' },
                visual: { hideFormTitle: true },
              }}
              onSubmit={handlePaymentSubmit}
              onError={(err) => setError(String(err?.message || err))}
            />
            {error && <p className="cm-error-msg">{error}</p>}
          </div>
        )}

        {step === 'result' && result && (
          <div className="cm-step cm-result">
            {result.status === 'APPROVED' ? (
              <>
                <CheckCircle size={56} className="cm-icon cm-icon--success" />
                <h2 className="cm-title">¡Contribución exitosa!</h2>
                <p className="cm-subtitle">
                  Tu aporte de <strong>{amountFormatted}</strong> fue procesado correctamente.
                </p>
                <Button variant="primary" className="cm-btn" onClick={onClose}>
                  Cerrar
                </Button>
              </>
            ) : result.status === 'IN_PROCESS' ? (
              <>
                <Loader size={56} className="cm-icon cm-icon--pending cm-spin" />
                <h2 className="cm-title">Pago en proceso</h2>
                <p className="cm-subtitle">
                  Tu pago está siendo verificado. Te notificaremos cuando se confirme.
                </p>
                <Button variant="primary" className="cm-btn" onClick={onClose}>
                  Entendido
                </Button>
              </>
            ) : (
              <>
                <XCircle size={56} className="cm-icon cm-icon--error" />
                <h2 className="cm-title">No se pudo procesar el pago</h2>
                <p className="cm-subtitle">
                  Verificá los datos de tu tarjeta e intentá de nuevo.
                </p>
                <div className="cm-btn-row">
                  <Button variant="secondary" className="cm-btn" onClick={handleRetry}>
                    Intentar de nuevo
                  </Button>
                  <Button variant="primary" className="cm-btn" onClick={onClose}>
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
