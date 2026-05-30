import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { contributionService } from '$utils/contributionService'
import { CheckCircle, XCircle, Clock, Loader } from 'lucide-react'
import './PaymentReturn.css'

export default function PaymentReturn() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const campaignId = searchParams.get('campaignId')

  function goBack() {
    if (campaignId) navigate(`/campaigns/${campaignId}`)
    else navigate('/')
  }

  useEffect(() => {
    async function processReturn() {
      // MP agrega estos params al back_url
      const contributionId = searchParams.get('contributionId') || searchParams.get('external_reference')
      const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id')
      const mpStatus = searchParams.get('collection_status') || searchParams.get('status')

      if (!contributionId) {
        setStatus('error')
        setError('No se pudo identificar la contribución.')
        return
      }

      // Si MP ya indica failure/pending sin payment_id, mostramos directo
      if (!paymentId && mpStatus === 'failure') {
        setStatus('REJECTED')
        return
      }

      if (!paymentId) {
        setStatus('error')
        setError('No se recibió el ID de pago de Mercado Pago.')
        return
      }

      try {
        const data = await contributionService.process(contributionId, {
          paymentType: 'wallet_purchase',
          paymentId: Number(paymentId),
        })
        setStatus(data.status)
      } catch (err) {
        setStatus('error')
        setError(err.message)
      }
    }

    processReturn()
  }, [])

  return (
    <div className="pr-page">
      <div className="pr-card">
        {status === 'loading' && (
          <>
            <div className="pr-icon pr-icon--pending">
              <Loader size={40} className="pr-spin" />
            </div>
            <h1 className="pr-title">Verificando tu pago...</h1>
            <p className="pr-subtitle">Estamos confirmando el estado de tu contribución con Mercado Pago.</p>
          </>
        )}

        {status === 'APPROVED' && (
          <>
            <div className="pr-icon pr-icon--success">
              <CheckCircle size={40} />
            </div>
            <h1 className="pr-title">¡Contribución exitosa!</h1>
            <p className="pr-subtitle">Tu pago fue aprobado por Mercado Pago. ¡Gracias por apoyar la campaña!</p>
            <button className="pr-btn pr-btn--primary" onClick={goBack}>
              Volver a la campaña
            </button>
          </>
        )}

        {(status === 'IN_PROCESS' || status === 'pending') && (
          <>
            <div className="pr-icon pr-icon--pending">
              <Clock size={40} />
            </div>
            <h1 className="pr-title">Pago en proceso</h1>
            <p className="pr-subtitle">Tu pago está siendo verificado. Te notificaremos cuando se confirme.</p>
            <button className="pr-btn pr-btn--primary" onClick={goBack}>
              Volver a la campaña
            </button>
          </>
        )}

        {(status === 'REJECTED' || status === 'CANCELLED') && (
          <>
            <div className="pr-icon pr-icon--error">
              <XCircle size={40} />
            </div>
            <h1 className="pr-title">No se pudo procesar el pago</h1>
            <p className="pr-subtitle">Mercado Pago rechazó o canceló la transacción. Podés intentarlo de nuevo.</p>
            <button className="pr-btn pr-btn--secondary" onClick={goBack}>
              Volver e intentar de nuevo
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="pr-icon pr-icon--error">
              <XCircle size={40} />
            </div>
            <h1 className="pr-title">Ocurrió un error</h1>
            <p className="pr-subtitle">{error || 'No pudimos procesar el resultado del pago.'}</p>
            <button className="pr-btn pr-btn--secondary" onClick={goBack}>
              Volver a la campaña
            </button>
          </>
        )}
      </div>
    </div>
  )
}
