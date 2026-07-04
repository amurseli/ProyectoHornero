import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '$utils/api/api'
import { formatDateTime } from '$utils/datetime'
import ShaderBackground from '$components/ShaderBackground'
import './TransactionHistory.css'

// Etiquetas legibles en español para el tipo de movimiento (historyType del backend).
const TIPO_LABELS = {
  CONTRIBUTION: 'Aporte',
  PAYOUT: 'Pago a creador',
  REFUND: 'Reembolso',
}

// Etiquetas legibles para el estado (entryStatus). Hoy la query solo devuelve APPROVED y
// COMPLETED, pero mapeamos también el resto por si el historial se amplía en el futuro.
const ESTADO_LABELS = {
  APPROVED: 'Aprobado',
  COMPLETED: 'Completado',
  PENDING: 'Pendiente',
  IN_PROCESS: 'En proceso',
  PROCESSING: 'Procesando',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
  FAILED: 'Fallido',
  PENDING_MANUAL_TRANSFER: 'Transferencia manual pendiente',
}

function WholeWordIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M15.5 12.5C15.776 12.5 16 12.724 16 13V13.5C16 14.327 15.327 15 14.5 15H1.5C0.673 15 0 14.327 0 13.5V13C0 12.724 0.224 12.5 0.5 12.5C0.776 12.5 1 12.724 1 13V13.5C1 13.775 1.224 14 1.5 14H14.5C14.776 14 15 13.775 15 13.5V13C15 12.724 15.224 12.5 15.5 12.5Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M4.8584 5.6709C6.16516 5.73603 6.94308 6.48734 6.99707 7.69922L7 7.83594V11.5107C6.996 11.7596 6.80919 11.9649 6.56836 11.998L6.5 12.0029C6.24709 12.0029 6.038 11.8152 6.00488 11.5713L6 11.5029V11.4326C5.341 11.8096 4.73199 12.0029 4.16699 12.0029C2.941 12.0029 2 11.1399 2 9.83594C2.00003 8.68597 2.79247 7.83185 4.10645 7.67285C4.7283 7.59793 5.35918 7.64552 5.99902 7.81348C5.99202 7.07548 5.62762 6.70995 4.80762 6.66895C4.16686 6.637 3.7161 6.72717 3.45215 6.91211C3.22615 7.07111 2.91386 7.01604 2.75586 6.79004C2.5969 6.56404 2.65194 6.25174 2.87793 6.09375C3.31692 5.78579 3.91404 5.65006 4.66699 5.66406L4.8584 5.6709ZM5.79688 8.81836C5.25888 8.67037 4.73558 8.62843 4.22559 8.69043C3.40389 8.79054 2.99902 9.22747 2.99902 9.86035C2.99917 10.5911 3.47413 11.0273 4.16602 11.0273C4.62001 11.0273 5.17799 10.8168 5.83398 10.3848L5.99902 10.2725V8.87891L5.79688 8.81836Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M9.55078 2.00586C9.78578 2.02986 9.97307 2.21715 9.99707 2.45215C10 2.46907 10 2.48601 10 2.50293V6.60254C10.418 6.22566 10.9371 6.00293 11.5 6.00293C12.881 6.00293 14 7.34596 14 9.00293C14 10.6599 12.881 12.0029 11.5 12.0029C10.9371 12.0029 10.418 11.7802 10 11.4033V11.5029C10 11.7619 9.80278 11.974 9.55078 12C9.53385 12.003 9.51693 12.0029 9.5 12.0029C9.224 12.0029 9 11.7789 9 11.5029V2.50293C9 2.486 9.00095 2.46907 9.00293 2.45215C9.02793 2.20015 9.241 2.00293 9.5 2.00293C9.51692 2.00293 9.53386 2.00388 9.55078 2.00586ZM11.4355 7.00391C11.0307 7.03208 10.5769 7.31545 10.29 7.82227C10.1232 8.12611 10.018 8.49479 10.002 8.89453C9.99995 8.92952 10 8.96597 10 9.00195C10 9.03795 10.001 9.07438 10.002 9.10938C10.018 9.50814 10.1222 9.87582 10.2891 10.1797C10.576 10.6875 11.0307 10.9728 11.4355 11C11.4565 11.002 11.478 11.002 11.5 11.002C11.522 11.002 11.5435 11.001 11.5645 11C11.9693 10.9728 12.424 10.6875 12.7109 10.1797C12.8778 9.87582 12.982 9.50814 12.998 9.10938C13 9.07438 13 9.03795 13 9.00195C13 8.96597 12.999 8.92952 12.998 8.89453C12.982 8.49479 12.8768 8.12611 12.71 7.82227C12.4231 7.31545 11.9693 7.03109 11.5645 7.00391C11.5435 7.00191 11.522 7.00195 11.5 7.00195C11.478 7.00195 11.4565 7.00291 11.4355 7.00391Z" />
    </svg>
  )
}

function labelTipo(value) {
  return TIPO_LABELS[value] || value || 'N/D'
}

function labelEstado(value) {
  return ESTADO_LABELS[value] || value || 'N/D'
}

function formatAmount(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(amount ?? 0)
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

// Devuelve true si el movimiento involucra al usuario (como emisor o receptor).
// Contribuciones: senderLabel = user_name. Payouts: recipientLabel = CREATOR_<user_name>.
// Reembolsos: recipientLabel = user_name. Por eso miramos ambos extremos.
// exact = true (ej. "Mis transacciones") exige coincidencia exacta del usuario para no
// mezclar cuentas con nombres que son prefijo de otras (test_creator_1 vs test_creator_10).
function matchesUser(transaction, query, exact) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const sender = (transaction.senderLabel || '').toLowerCase()
  const recipient = (transaction.recipientLabel || '').toLowerCase()
  if (exact) {
    return sender === q || recipient === q || recipient === `creator_${q}`
  }
  return sender.includes(q) || recipient.includes(q)
}

function TransactionHistory() {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [searchParams] = useSearchParams()
  const [userFilter, setUserFilter] = useState(searchParams.get('user') || '')
  // Coincidencia exacta de usuario, controlada por el botón "palabra completa" del campo.
  // Arranca activa al llegar desde ?user= (ej. "Mis transacciones") y es sticky (tipear no la cambia).
  const [userExact, setUserExact] = useState(Boolean(searchParams.get('user')))
  const [campaignFilter, setCampaignFilter] = useState('')
  // Coincidencia exacta de campaña, controlada por el botón "palabra completa" del campo.
  const [campaignExact, setCampaignExact] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

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

  // Sincroniza el filtro de usuario con el parámetro ?user= (ej. "Mis transacciones"
  // del navbar) también cuando se navega estando ya en esta página.
  useEffect(() => {
    const paramUser = searchParams.get('user') || ''
    setUserFilter(paramUser)
    setUserExact(Boolean(paramUser))
  }, [searchParams])

  // Estados presentes en los datos, para poblar el desplegable sin opciones vacías.
  const availableStatuses = useMemo(() => {
    const set = new Set(transactions.map((t) => t.entryStatus).filter(Boolean))
    return Array.from(set)
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    const campaignQuery = campaignFilter.trim().toLowerCase()
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null

    return transactions.filter((transaction) => {
      if (!matchesUser(transaction, userFilter, userExact)) return false
      if (campaignQuery) {
        const title = (transaction.campaignTitle || '').toLowerCase()
        if (campaignExact ? title !== campaignQuery : !title.includes(campaignQuery)) return false
      }
      if (statusFilter && transaction.entryStatus !== statusFilter) return false

      if (from || to) {
        const created = transaction.createdAt ? new Date(transaction.createdAt) : null
        if (!created) return false
        if (from && created < from) return false
        if (to && created > to) return false
      }
      return true
    })
  }, [transactions, userFilter, userExact, campaignFilter, campaignExact, statusFilter, dateFrom, dateTo])

  const hasActiveFilters = Boolean(userFilter || campaignFilter || statusFilter || dateFrom || dateTo)

  function clearFilters() {
    setUserFilter('')
    setUserExact(false)
    setCampaignFilter('')
    setCampaignExact(false)
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
  }

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

      <div className="transaction-history-content">
        <ShaderBackground className="transaction-history-canvas" scale={4.6} />
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
          <>
            <div className="transaction-filters">
              <div className="transaction-filter-field">
                <label htmlFor="filter-user">Usuario</label>
                <div className="transaction-filter-input-wrap">
                  <input
                    id="filter-user"
                    type="text"
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    placeholder="Nombre de usuario"
                  />
                  <button
                    type="button"
                    className={`transaction-filter-toggle ${userExact ? 'active' : ''}`}
                    onClick={() => setUserExact((v) => !v)}
                    aria-pressed={userExact}
                    aria-label="Coincidir palabra completa"
                    title="Coincidir palabra completa"
                  >
                    <WholeWordIcon />
                  </button>
                </div>
              </div>
              <div className="transaction-filter-field">
                <label htmlFor="filter-campaign">Campaña</label>
                <div className="transaction-filter-input-wrap">
                  <input
                    id="filter-campaign"
                    type="text"
                    value={campaignFilter}
                    onChange={(e) => setCampaignFilter(e.target.value)}
                    placeholder="Título de campaña"
                  />
                  <button
                    type="button"
                    className={`transaction-filter-toggle ${campaignExact ? 'active' : ''}`}
                    onClick={() => setCampaignExact((v) => !v)}
                    aria-pressed={campaignExact}
                    aria-label="Coincidir palabra completa"
                    title="Coincidir palabra completa"
                  >
                    <WholeWordIcon />
                  </button>
                </div>
              </div>
              <div className="transaction-filter-field">
                <label htmlFor="filter-status">Estado</label>
                <select
                  id="filter-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Todos</option>
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>{labelEstado(status)}</option>
                  ))}
                </select>
              </div>
              <div className="transaction-filter-field">
                <label htmlFor="filter-date-from">Desde</label>
                <input
                  id="filter-date-from"
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="transaction-filter-field">
                <label htmlFor="filter-date-to">Hasta</label>
                <input
                  id="filter-date-to"
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              {hasActiveFilters ? (
                <button type="button" className="transaction-filter-clear" onClick={clearFilters}>
                  Limpiar filtros
                </button>
              ) : null}
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="transaction-history-state">
                Ningún movimiento coincide con los filtros seleccionados.
              </div>
            ) : null}

            <div className="transaction-history-list">
            {filteredTransactions.map((transaction) => {
              const hashState = getHashStatus(transaction.hashTx)
              return (
                <article className="transaction-card" key={`${transaction.historyType}-${transaction.transactionId}`}>
                  <div className="transaction-card-header">
                    <div className="transaction-card-headline">
                      <p className="transaction-card-title">{describeTransaction(transaction)}</p>
                    </div>
                    <span className={`transaction-status ${hashState.tone}`}>{hashState.label}</span>
                  </div>

                  <div className="transaction-card-grid">
                    <div className="transaction-cell">
                      <span className="transaction-label">Monto</span>
                      <strong className="transaction-value">{formatAmount(transaction.amount)}</strong>
                    </div>
                    <div className="transaction-cell">
                      <span className="transaction-label">Campaña</span>
                      <strong className="transaction-value" title={transaction.campaignTitle || ''}>{transaction.campaignTitle || 'N/D'}</strong>
                    </div>
                    <div className="transaction-cell">
                      <span className="transaction-label">Estado</span>
                      <strong className="transaction-value">{labelEstado(transaction.entryStatus)}</strong>
                    </div>
                    <div className="transaction-cell">
                      <span className="transaction-label">Proveedor</span>
                      <strong className="transaction-value">{transaction.paymentProvider || 'N/D'}</strong>
                    </div>
                    <div className="transaction-cell">
                      <span className="transaction-label">Fecha</span>
                      <strong className="transaction-value">{formatDateTime(transaction.createdAt)}</strong>
                    </div>
                    <div className="transaction-cell">
                      <span className="transaction-label">Tipo</span>
                      <strong className="transaction-value">{labelTipo(transaction.historyType)}</strong>
                    </div>
                    <div className="transaction-cell">
                      <span className="transaction-label">N° de Operación</span>
                      <strong className="transaction-value transaction-value--mono" title={transaction.operationNumber || ''}>{transaction.operationNumber || 'N/D'}</strong>
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
          </>
        ) : null}
        </section>
      </div>
    </main>
  )
}

export default TransactionHistory
