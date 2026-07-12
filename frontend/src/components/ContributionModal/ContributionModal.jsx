import { useEffect, useRef, useState } from 'react'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'
import { contributionService } from '$utils/contributionService'
import { Button } from '$components/ui'
import { X, CheckCircle, XCircle, Loader, Clock, ChevronRight, ArrowLeft } from 'lucide-react'
import './ContributionModal.css'

function formatMoney(value) {
  return `ARS $${Number(value || 0).toLocaleString('es-AR')}`
}

function normalizeAmount(value, fallback = 1) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function sanitizeAmountInput(raw) {
  const digitsOnly = raw.replace(/[^0-9]/g, '')
  return digitsOnly.replace(/^0+(?=\d)/, '')
}

const AMOUNT_SUGGESTIONS = [500, 1000, 2000, 5000]

const STEPS = ['Aporte', 'Pago', 'Resultado']
const STEP_INDEX = { select: 0, amount: 0, reward: 0, payment: 1, result: 2 }

// Mirrors the gating in CampaignPage's getRewardAccessState so a tier the user
// already owns (or one of equal/lower value) can't be re-selected in the modal.
function getTierAccess(tier, contributionSummary) {
  const currentRewardId = contributionSummary?.currentReward?.rewardId || null
  const currentRewardPrice = Number(contributionSummary?.currentReward?.rewardPrice || 0)
  const tierPrice = Number(tier?.price || 0)

  if (currentRewardId === tier.id) {
    return { disabled: true, badge: '¡Ya formás parte de esta tier!' }
  }
  if (currentRewardId && tierPrice <= currentRewardPrice) {
    return { disabled: true, badge: 'Ya tenés una recompensa de igual o mayor valor.' }
  }
  return { disabled: false, badge: null }
}

export default function ContributionModal({
  campaignId,
  initialAmount = 1,
  reward = null,
  rewards = [],
  contributionSummary = null,
  onClose,
  onCompleted,
}) {
  // A reward passed via prop means the user already picked a tier on the page:
  // skip selection and go straight to preparing that reward.
  const forcedReward = reward
  const availableRewards = Array.isArray(rewards) ? rewards : []
  const initialStep = forcedReward ? 'reward' : availableRewards.length > 0 ? 'select' : 'amount'

  const [step, setStep] = useState(initialStep)
  const [selectedReward, setSelectedReward] = useState(forcedReward)
  const [amount, setAmount] = useState(Number(initialAmount) || 1)
  const [amountInput, setAmountInput] = useState(String(Number(initialAmount) || 1))
  const [contributionId, setContributionId] = useState(null)
  const [preferenceId, setPreferenceId] = useState(null)
  const [mpReady, setMpReady] = useState(false)
  const [rewardMeta, setRewardMeta] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [amountError, setAmountError] = useState('')
  const mpInitialized = useRef(false)

  const rewardMode = !!selectedReward

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
      const nextAmountValue = normalizeAmount(data.amount)
      setAmount(nextAmountValue)
      setAmountInput(String(nextAmountValue))
      setRewardMeta(data.reward || null)
      setPreferenceId(data.preferenceId ?? null)
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
    if (step !== 'reward' || !selectedReward) return
    startContribution({ rewardId: selectedReward.id })
  }, [step, selectedReward?.id])

  function handleSelectReward(tier) {
    setError(null)
    setSelectedReward(tier)
    setStep('reward')
  }

  function goToFreeAmount() {
    setError(null)
    setSelectedReward(null)
    setStep('amount')
  }

  function goToRewardSelection() {
    setError(null)
    setSelectedReward(null)
    setStep('select')
  }

  function handleAmountInputChange(e) {
    const sanitized = sanitizeAmountInput(e.target.value)
    setAmountInput(sanitized)
    const parsed = Number(sanitized)
    setAmount(Number.isFinite(parsed) ? parsed : 0)
    if (amountError) setAmountError('')
  }

  // Valida el monto al perder el foco: mínimo $1.
  function handleAmountBlur() {
    setAmountError(amount >= 1 ? '' : 'Ingresá un monto de al menos $1.')
  }

  function selectSuggestedAmount(value) {
    setAmount(value)
    setAmountInput(String(value))
  }

  async function handleAmountSubmit(e) {
    e.preventDefault()
    if (amount < 1) return
    await startContribution({ nextAmount: amount })
  }

  async function handlePaymentSubmit({ selectedPaymentMethod, formData }) {
    if (selectedPaymentMethod === 'wallet_purchase' || formData?.paymentType === 'wallet_purchase') {
      // MP redirige al usuario a su sitio; el resultado se maneja en /payment/return
      return
    }
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
    setResult(null)
    setContributionId(null)
    setPreferenceId(null)
    setMpReady(false)
    setRewardMeta(null)
    mpInitialized.current = false
    setError(null)
    if (forcedReward) {
      setStep('reward')
    } else if (availableRewards.length > 0) {
      setSelectedReward(null)
      setStep('select')
    } else {
      setSelectedReward(null)
      setStep('amount')
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  const amountFormatted = formatMoney(amount)
  const rewardPriceFormatted = formatMoney(rewardMeta?.rewardPrice ?? selectedReward?.price)
  const previousRewardFormatted = formatMoney(rewardMeta?.previousRewardPrice)
  const resultAmount = normalizeAmount(result?.amount, amount)
  const resultAmountFormatted = formatMoney(resultAmount)
  const rewardActivatedWithoutPayment = rewardMode && result?.status === 'APPROVED' && resultAmount === 0
  const currentStepIndex = STEP_INDEX[step]

  return (
    <div className="cm-overlay" onClick={handleOverlayClick}>
      <div className="cm-modal" role="dialog" aria-modal="true">
        <button className="cm-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        {/* Step indicator */}
        <div className="cm-steps">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`cm-step-item ${i < currentStepIndex ? 'cm-step-item--done' : ''} ${i === currentStepIndex ? 'cm-step-item--active' : ''}`}
            >
              <div className="cm-step-dot">
                {i < currentStepIndex ? <CheckCircle size={14} /> : <span>{i + 1}</span>}
              </div>
              <span className="cm-step-label">{label}</span>
              {i < STEPS.length - 1 && <div className="cm-step-line" />}
            </div>
          ))}
        </div>

        {step === 'select' && (
          <div className="cm-body">
            <h2 className="cm-title">Elegí tu recompensa</h2>
            <p className="cm-subtitle">Sumate al proyecto eligiendo una recompensa. El monto se completa automáticamente.</p>

            <div className="cm-tier-list">
              {availableRewards.map((tier) => {
                const access = getTierAccess(tier, contributionSummary)
                return (
                  <button
                    key={tier.id}
                    type="button"
                    className={`cm-tier ${access.disabled ? 'cm-tier--disabled' : ''}`}
                    onClick={() => !access.disabled && handleSelectReward(tier)}
                    disabled={access.disabled}
                    aria-disabled={access.disabled}
                  >
                    <div className="cm-tier-main">
                      <span className="cm-tier-price">{formatMoney(tier.price)}</span>
                      <span className="cm-tier-title">{tier.title}</span>
                      {tier.description && <span className="cm-tier-desc">{tier.description}</span>}
                      {access.badge && <span className="cm-tier-badge">{access.badge}</span>}
                    </div>
                    {!access.disabled && <ChevronRight size={18} className="cm-tier-arrow" />}
                  </button>
                )
              })}
            </div>

            {contributionSummary?.currentReward?.rewardId && (
              <p className="cm-tier-hint">
                Si querés seguir apoyando sin cambiar de recompensa, podés aportar el monto que quieras.
              </p>
            )}

            <button type="button" className="cm-link-btn" onClick={goToFreeAmount}>
              Prefiero aportar otro monto
            </button>
          </div>
        )}

        {step === 'amount' && (
          <div className="cm-body">
            {availableRewards.length > 0 && (
              <button type="button" className="cm-back-link" onClick={goToRewardSelection}>
                <ArrowLeft size={14} /> Volver a las recompensas
              </button>
            )}
            <h2 className="cm-title">Aportá lo que quieras</h2>
            <p className="cm-subtitle">Ingresá el monto que querés aportar a esta campaña.</p>

            <div className="cm-chips">
              {AMOUNT_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`cm-chip ${amount === s ? 'cm-chip--active' : ''}`}
                  onClick={() => selectSuggestedAmount(s)}
                >
                  ${s.toLocaleString('es-AR')}
                </button>
              ))}
            </div>

            <form onSubmit={handleAmountSubmit}>
              <div className="cm-amount-row">
                <span className="cm-amount-prefix">ARS $</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="cm-amount-input"
                  value={amountInput}
                  onChange={handleAmountInputChange}
                  onBlur={handleAmountBlur}
                  required
                  autoFocus
                />
              </div>
              {amountError && <p className="cm-error-msg">{amountError}</p>}
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
              Estamos validando <strong>{selectedReward.title}</strong> y calculando el monto exacto a pagar.
            </p>
            <div className="cm-reward-card">
              <div>
                <strong>{selectedReward.title}</strong>
                <p className="cm-reward-copy">Monto total de la recompensa: {formatMoney(selectedReward.price)}</p>
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
          <div className="cm-body">
            {rewardMode ? (
              <>
                <h2 className="cm-title">Datos de pago</h2>
                <p className="cm-subtitle">
                  Seleccionaste <strong>{selectedReward.title}</strong>. El monto de esta recompensa queda fijo en <strong>{rewardPriceFormatted}</strong>.
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
              <div className="cm-payment-summary">
                <span className="cm-payment-summary__label">Contribución</span>
                <span className="cm-payment-summary__amount">{amountFormatted}</span>
              </div>
            )}
            <Payment
              initialization={{ amount, ...(preferenceId ? { preferenceId } : {}) }}
              customization={{
                paymentMethods: {
                  creditCard: 'all',
                  debitCard: 'all',
                  ...(preferenceId ? { mercadoPago: 'all' } : {}),
                },
                visual: { hideFormTitle: true },
              }}
              onSubmit={handlePaymentSubmit}
              onError={(err) => { if (err?.type === 'critical') setError(String(err?.message || err)) }}
            />
            {error && <p className="cm-error-msg">{error}</p>}
          </div>
        )}

        {step === 'result' && result && (
          <div className="cm-body cm-result">
            {result.status === 'APPROVED' ? (
              <>
                <div className="cm-result-icon cm-result-icon--success">
                  <CheckCircle size={40} />
                </div>
                <h2 className="cm-title">{rewardActivatedWithoutPayment ? '¡Recompensa activada!' : '¡Contribución exitosa!'}</h2>
                <p className="cm-subtitle">
                  {rewardActivatedWithoutPayment
                    ? <>Activaste la recompensa <strong>{selectedReward.title}</strong> con tus aportes previos.</>
                    : rewardMode
                    ? <>Tu pago de <strong>{resultAmountFormatted}</strong> para <strong>{selectedReward.title}</strong> fue procesado correctamente.</>
                    : <>Tu aporte de <strong>{amountFormatted}</strong> fue procesado correctamente. ¡Gracias por apoyar esta campaña!</>}
                </p>
                <Button variant="primary" className="cm-btn" onClick={onClose}>
                  Cerrar
                </Button>
              </>
            ) : result.status === 'IN_PROCESS' ? (
              <>
                <div className="cm-result-icon cm-result-icon--pending">
                  <Clock size={40} />
                </div>
                <h2 className="cm-title">Pago en proceso</h2>
                <p className="cm-subtitle">
                  Tu pago está siendo verificado por Mercado Pago. Te notificaremos cuando se confirme.
                </p>
                <Button variant="primary" className="cm-btn" onClick={onClose}>
                  Entendido
                </Button>
              </>
            ) : (
              <>
                <div className="cm-result-icon cm-result-icon--error">
                  <XCircle size={40} />
                </div>
                <h2 className="cm-title">No se pudo procesar el pago</h2>
                <p className="cm-subtitle">
                  {result.error
                    ? result.error
                    : 'Verificá los datos ingresados o intentá con otro método de pago.'}
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
