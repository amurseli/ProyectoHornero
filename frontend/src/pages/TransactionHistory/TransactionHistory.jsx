import { useEffect, useState } from 'react'
import api from '$utils/api/api'
import './TransactionHistory.css'

function formatAmount(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(amount ?? 0)
}

function formatDate(value) {
  if (!value) return 'Sin fecha'

  const normalizedValue = typeof value === 'string' && !value.endsWith('Z')
    ? `${value}Z`
    : value

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(normalizedValue))
}

function getHashStatus(hashTx) {
  if (!hashTx) return { label: 'Sin hash', tone: 'empty' }
  if (hashTx === 'WALLET_OUT_OF_MONEY') return { label: 'Wallet sin fondos', tone: 'warning' }
  if (hashTx === 'BLOCKCHAIN_REGISTRATION_FAILED') return { label: 'Sin registro on-chain', tone: 'muted' }
  return { label: 'Registrada en blockchain', tone: 'success' }
}

function describeTransaction(transaction) {
  return `${transaction.senderLabel} --> ${transaction.recipientLabel}`
}

function TransactionHistory() {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadHistory() {
      try {
        setIsLoading(true)
        const response = await api.get('/api/transactions/history')
        if (mounted) {
          setTransactions(response)
          setError('')
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'No se pudo cargar el historial de transacciones')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadHistory()
    return () => { mounted = false }
  }, [])

  return (
    <main className="transaction-history-page">
      <section className="transaction-history-hero">
        <div className="transaction-history-shell">
          <h1>Historial de transacciones</h1>
          <p>
            Consultá todos los pagos registrados en la aplicación y, cuando exista hash on-chain,
            seguí el enlace directo a Polygonscan Amoy.
          </p>
        </div>
      </section>

      <section className="transaction-history-shell transaction-history-section">
        {isLoading ? <div className="transaction-history-state">Cargando historial...</div> : null}
        {!isLoading && error ? (
          <div className="transaction-history-state error">
            <strong>No se pudo cargar el historial.</strong>
            <div>{error}</div>
          </div>
        ) : null}
        {!isLoading && !error && transactions.length === 0 ? (
          <div className="transaction-history-state">Todavía no hay transacciones registradas.</div>
        ) : null}

        {!isLoading && !error && transactions.length > 0 ? (
          <div className="transaction-history-list">
            {transactions.map((transaction) => {
              const hashState = getHashStatus(transaction.hashTx)
              return (
                <article className="transaction-card" key={transaction.transactionId}>
                  <div className="transaction-card-header">
                    <div>
                      <p className="transaction-card-title">{describeTransaction(transaction)}</p>
                    </div>
                    <span className={`transaction-status ${hashState.tone}`}>{hashState.label}</span>
                  </div>

                  <div className="transaction-card-grid">
                    <div>
                      <span className="transaction-label">Monto</span>
                      <strong>{formatAmount(transaction.amount)}</strong>
                    </div>
                    <div>
                      <span className="transaction-label">Campaña</span>
                      <strong>{transaction.campaignTitle}</strong>
                    </div>
                    <div>
                      <span className="transaction-label">Estado</span>
                      <strong>{transaction.entryStatus}</strong>
                    </div>
                    <div>
                      <span className="transaction-label">Proveedor</span>
                      <strong>{transaction.paymentProvider || 'N/D'}</strong>
                    </div>
                    <div>
                      <span className="transaction-label">Fecha</span>
                      <strong>{formatDate(transaction.createdAt)}</strong>
                    </div>
                    <div>
                      <span className="transaction-label">Tipo</span>
                      <strong>{transaction.historyType}</strong>
                    </div>
                  </div>

                  <div className="transaction-card-footer">
                    <div className="transaction-hash-block">
                      <span className="transaction-label">Hash TX</span>
                      <code className="transaction-code">{transaction.hashTx || 'NULL'}</code>
                    </div>
                    {transaction.explorerUrl ? (
                      <a
                        className="transaction-link"
                        href={transaction.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver en Polygonscan
                      </a>
                    ) : (
                      <span className="transaction-link disabled">Sin enlace on-chain</span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default TransactionHistory
