import { useEffect, useRef, useState } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import { contributionService } from '$utils/contributionService'
import { Button } from '$components/ui'
import { X, CheckCircle, XCircle, Loader } from 'lucide-react'
import './ContributionModal.css'

function formatMoney(value) {
  return `ARS $${Number(value || 0).toLocaleString('es-AR')}`
}

export default function ContributionModal({ campaignId, initialAmount = 1, reward = null, onClose, onCompleted }) {
  const rewardMode = !!reward
  const [step, setStep] = useState(rewardMode ? 'reward' : 'amount')
  const [amount, setAmount] = useState(Number(initialAmount) || 1)
  const [contributionId, setContributionId] = useState(null)
  const [mpReady, setMpReady] = useState(false)
  const [rewardMeta, setRewardMeta] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const mpInitialized = useRef(false)

  async function startContribution({ nextAmount = null, rewardId = null } = {}) {
    setLoading(true)
    setError(null)
    try {
      const data = await contributionService.initiate(campaignId, nextAmount, rewardId)
      if (!mpInitialized.current) {
        initMercadoPago(data.publicKey, { locale: 'es-AR' })
        mpInitialized.current = true
      }
      setContributionId(data.contributionId)
      setAmount(Number(data.amount) || 1)
      setRewardMeta(data.reward || null)
      if (data.status === 'APPROVED' && Number(data.amount) === 0) {
        setResult({ status: 'APPROVED', reward: data.reward, amount: data.amount })
        onCompleted?.()
        setStep('result')
      } else {
        setMpReady(true)
        setStep('payment')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (step !== 'reward' || !rewardMode) return
    startContribution({ rewardId: reward.id })
  }, [step, rewardMode, reward?.id])

  async function handleAmountSubmit(e) {
    e.preventDefault()
    if (amount < 1) return
    await startContribution({ nextAmount: amount })
  }

  async function handlePaymentSubmit({ formData }) {
    try {
      const data = await contributionService.process(contributionId, formData)
      setResult(data)
      if (data.status === 'APPROVED') onCompleted?.()
      setStep('result')
    } catch (err) {
      setResult({ status: 'REJECTED', error: err.message })
      setStep('result')
    }
  }

  function handleRetry() {
    setStep(rewardMode ? 'reward' : 'amount')
    setResult(null)
    setContributionId(null)
    setMpReady(false)
    setRewardMeta(null)
    mpInitialized.current = false
    setError(null)
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  const amountFormatted = formatMoney(amount)
  const rewardPriceFormatted = formatMoney(rewardMeta?.rewardPrice ?? reward?.price)
  const previousRewardFormatted = formatMoney(rewardMeta?.previousRewardPrice)

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

        {step === 'reward' && rewardMode && (
          <div className="cm-step">
            <h2 className="cm-title">Preparando recompensa</h2>
            <p className="cm-subtitle">
              Estamos validando <strong>{reward.title}</strong> y calculando el monto exacto a pagar.
            </p>
            <div className="cm-reward-card">
              <div>
                <strong>{reward.title}</strong>
                <p className="cm-reward-copy">Monto total de la recompensa: {formatMoney(reward.price)}</p>
              </div>
            </div>
            {loading ? (
              <div className="cm-loading-note">
                <Loader size={16} className="cm-spin" /> Preparando el pago...
              </div>
            ) : null}
            {error && (
              <>
                <p className="cm-error-msg">{error}</p>
                <div className="cm-btn-row">
                  <Button variant="secondary" className="cm-btn" onClick={handleRetry}>
                    Reintentar
                  </Button>
                  <Button variant="primary" className="cm-btn" onClick={onClose}>
                    Cerrar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'payment' && mpReady && (
          <div className="cm-step">
            <h2 className="cm-title">Datos de pago</h2>
            {rewardMode ? (
              <>
                <p className="cm-subtitle">
                  Seleccionaste <strong>{reward.title}</strong>. El monto de esta recompensa queda fijo en <strong>{rewardPriceFormatted}</strong>.
                </p>
                <div className="cm-reward-summary">
                  <div className="cm-reward-summary-row">
                    <span>Total de la recompensa</span>
                    <strong>{rewardPriceFormatted}</strong>
                  </div>
                  {rewardMeta?.previousRewardId ? (
                    <>
                      <div className="cm-reward-summary-row">
                        <span>Tu recompensa actual</span>
                        <strong>{previousRewardFormatted}</strong>
                      </div>
                      <div className="cm-reward-summary-row cm-reward-summary-row--payable">
                        <span>Diferencia a pagar</span>
                        <strong>{amountFormatted}</strong>
                      </div>
                    </>
                  ) : (
                    <div className="cm-reward-summary-row cm-reward-summary-row--payable">
                      <span>Monto a pagar</span>
                      <strong>{amountFormatted}</strong>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="cm-subtitle">
                Estás contribuyendo <strong>{amountFormatted}</strong>
              </p>
            )}
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
                  {rewardMode
                    ? <>Tu pago de <strong>{amountFormatted}</strong> para <strong>{reward.title}</strong> fue procesado correctamente.</>
                    : <>Tu aporte de <strong>{amountFormatted}</strong> fue procesado correctamente.</>}
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
