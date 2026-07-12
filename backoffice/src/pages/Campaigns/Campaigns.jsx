import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  CreditCard,
  ExternalLink,
  Info,
  Search,
  Wallet,
} from 'lucide-react'
import { Button } from '../../components'
import api from '../../utils/api'
import { formatDateTime, getCampaignTimeLeft } from '../../utils/datetime'
import './Campaigns.css'

function formatCurrency(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-AR')
}

function isEnded(campaign) {
  if (!campaign?.endDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(`${campaign.endDate}T00:00:00`)
  return endDate < today
}

function compareCampaigns(a, b) {
  const aEnded = isEnded(a)
  const bEnded = isEnded(b)

  if (aEnded !== bEnded) {
    return aEnded ? -1 : 1
  }

  const aTime = a.endDate ? new Date(`${a.endDate}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER
  const bTime = b.endDate ? new Date(`${b.endDate}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER

  if (aEnded && bEnded) {
    return bTime - aTime
  }

  return aTime - bTime
}

function getCampaignTone(campaign) {
  if (campaign.transferCompleted) return 'completed'
  if (campaign.transferReady) return 'ready'
  if (campaign.ended) return campaign.reachedGoal ? 'successful' : 'failed'
  return 'active'
}

function getCampaignStatusText(campaign) {
  if (campaign.transferCompleted) return 'Transferida'
  if (campaign.transferReady) return 'Lista para transferir'
  if (campaign.ended && campaign.reachedGoal) return 'Finalizó con meta cumplida'
  if (campaign.ended) return 'Finalizó sin alcanzar la meta'
  return 'Activa'
}

function CampaignTransferModal({ transferData, actionLoading, actionError, transferReference, onReferenceChange, onClose, onConfirm }) {
  if (!transferData) return null

  const { campaign, payout } = transferData

  const copyValue = async (value) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // noop
    }
  }

  return (
    <div className="ac-modal-overlay" onClick={onClose}>
      <div className="ac-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ac-modal-header">
          <div>
            <h2>Transferir al creador</h2>
            <p>{campaign.title}</p>
          </div>
          <button type="button" className="ac-modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="ac-modal-grid">
          <section className="ac-modal-section">
            <h3>Resumen del payout</h3>
            <dl>
              <dt>Recaudado</dt>
              <dd>{formatCurrency(payout?.grossAmount ?? campaign.currentAmount)}</dd>
              <dt>Comisión plataforma</dt>
              <dd>{formatCurrency(payout?.platformFee)}</dd>
              <dt>Comisión proveedor</dt>
              <dd>{formatCurrency(payout?.providerFee)}</dd>
              <dt>Neto a transferir</dt>
              <dd className="ac-highlight">{formatCurrency(payout?.netAmount ?? campaign.currentAmount)}</dd>
            </dl>
          </section>

          <section className="ac-modal-section">
            <h3>Datos bancarios del creador</h3>
            <dl>
              <dt>Creador</dt>
              <dd>{transferData.creatorName || '—'}</dd>
              <dt>Email</dt>
              <dd>{transferData.creatorEmail || '—'}</dd>
              <dt>Banco / billetera</dt>
              <dd>{transferData.bankOrWalletName || '—'}</dd>
              <dt>Titular</dt>
              <dd>{transferData.accountHolderName || '—'}</dd>
              <dt>Tipo de cuenta</dt>
              <dd>{transferData.accountType || '—'}</dd>
              <dt>CBU / CVU</dt>
              <dd className="ac-copy-row">
                <span>{transferData.cbu || '—'}</span>
                {transferData.cbu && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => copyValue(transferData.cbu)}>
                    <Copy size={14} /> Copiar
                  </Button>
                )}
              </dd>
              <dt>Alias</dt>
              <dd className="ac-copy-row">
                <span>{transferData.alias || '—'}</span>
                {transferData.alias && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => copyValue(transferData.alias)}>
                    <Copy size={14} /> Copiar
                  </Button>
                )}
              </dd>
            </dl>
          </section>
        </div>

        <div className="ac-modal-note">
          Copiá el CBU o alias, hacé la transferencia manual desde la cuenta bancaria y después confirmala acá para registrar el payout y actualizar el estado de la campaña.
        </div>

        <div className="ac-modal-field">
          <label htmlFor="transfer-reference">Referencia de transferencia</label>
          <input
            id="transfer-reference"
            type="text"
            placeholder="Opcional: número de operación o referencia bancaria"
            value={transferReference}
            onChange={(event) => onReferenceChange(event.target.value)}
          />
        </div>

        {actionError && <div className="ac-error">{actionError}</div>}

        <div className="ac-modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={onConfirm} disabled={actionLoading}>
            {actionLoading ? 'Registrando...' : 'Transferencia realizada'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CampaignDetailModal({ detailData, loading, onClose }) {
  if (loading) {
    return (
      <div className="ac-modal-overlay" onClick={onClose}>
        <div className="ac-modal ac-modal--loading" onClick={(event) => event.stopPropagation()}>
          <div className="ac-loading">Cargando detalle de campaña...</div>
        </div>
      </div>
    )
  }

  if (!detailData) return null

  return (
    <div className="ac-modal-overlay" onClick={onClose}>
      <div className="ac-modal ac-modal--wide" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ac-modal-header">
          <div>
            <h2>Detalle de campaña</h2>
            <p>{detailData.campaign.title}</p>
          </div>
          <button type="button" className="ac-modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="ac-detail-summary">
          <div className="ac-detail-stat">
            <span>Aprobadas</span>
            <strong>{detailData.approvedContributionCount}</strong>
          </div>
          <div className="ac-detail-stat">
            <span>Monto aprobado real</span>
            <strong>{formatCurrency(detailData.approvedAmount)}</strong>
          </div>
          <div className="ac-detail-stat">
            <span>Contribuciones totales</span>
            <strong>{detailData.contributions?.length || 0}</strong>
          </div>
        </div>

        <div className="ac-detail-table-wrap">
          <table className="ac-detail-table">
            <thead>
              <tr>
                <th>Contribución</th>
                <th>Aportante</th>
                <th>Estado</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Transacción</th>
              </tr>
            </thead>
            <tbody>
              {(detailData.contributions || []).map((item) => (
                <tr key={item.contributionId}>
                  <td>#{item.contributionId}</td>
                  <td>
                    <div className="ac-detail-user">
                      <strong>{item.contributorName || `Usuario ${item.contributorUserId}`}</strong>
                      <span>{item.contributorEmail || 'Sin email disponible'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`ac-detail-badge ac-detail-badge--${(item.status || '').toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>{formatDateTime(item.createdAt, '—')}</td>
                  <td>
                    {item.transaction ? (
                      <div className="ac-detail-transaction">
                        <div><CreditCard size={14} /> {item.transaction.paymentProvider}</div>
                        <div>{item.transaction.transactionMethod}</div>
                        <div className="ac-detail-external">
                          <ExternalLink size={12} />
                          {item.transaction.externalTransactionId || `TX ${item.transaction.transactionId}`}
                        </div>
                      </div>
                    ) : (
                      <span className="ac-detail-muted">Sin transacción</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState(null)
  const [transferData, setTransferData] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [transferReference, setTransferReference] = useState('')
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchCampaigns = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get('/api/admin/campaigns')
      setCampaigns(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Error al cargar campañas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  // Bloquea el scroll de la página de atrás mientras haya un modal abierto,
  // para que la rueda del mouse scrollee el contenido del modal (si tiene) en
  // vez de mover la pantalla detrás del overlay.
  const isAnyModalOpen = modalLoading || Boolean(transferData) || detailLoading || Boolean(detailData)
  useEffect(() => {
    if (!isAnyModalOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [isAnyModalOpen])

  const filteredCampaigns = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return campaigns
      .filter((campaign) => {
        if (!normalized) return true
        return (campaign.title || '').toLowerCase().includes(normalized)
      })
      .sort(compareCampaigns)
  }, [campaigns, query])

  const stats = useMemo(() => ({
    total: campaigns.length,
    ended: campaigns.filter((campaign) => campaign.ended).length,
    ready: campaigns.filter((campaign) => campaign.transferReady).length,
  }), [campaigns])

  const openTransferModal = async (campaign) => {
    setSelectedCampaignId(campaign.id)
    setModalLoading(true)
    setActionError(null)
    setTransferReference('')
    try {
      const data = await api.post(`/api/admin/campaigns/${campaign.id}/prepare-transfer`, {})
      setTransferData(data)
    } catch (err) {
      setSelectedCampaignId(null)
      setActionError(err.message || 'No se pudo preparar la transferencia')
    } finally {
      setModalLoading(false)
    }
  }

  const closeTransferModal = () => {
    if (actionLoading) return
    setSelectedCampaignId(null)
    setTransferData(null)
    setActionError(null)
    setTransferReference('')
  }

  const openDetailModal = async (campaignId) => {
    setDetailLoading(true)
    setDetailData(null)
    try {
      const data = await api.get(`/api/admin/campaigns/${campaignId}/details`)
      setDetailData(data)
    } catch (err) {
      setError(err.message || 'No se pudo cargar el detalle de la campaña')
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetailModal = () => {
    setDetailData(null)
    setDetailLoading(false)
  }

  const confirmTransfer = async () => {
    if (!selectedCampaignId) return
    setActionLoading(true)
    setActionError(null)
    try {
      await api.patch(`/api/admin/campaigns/${selectedCampaignId}/confirm-transfer`, {
        transferReference,
      })
      await fetchCampaigns()
      closeTransferModal()
    } catch (err) {
      setActionError(err.message || 'No se pudo confirmar la transferencia')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="campaigns-page">
      <div className="ac-container">
        <div className="ac-header">
          <div>
            <h1>Campañas</h1>
            <p>Monitoreá campañas activas, detectá cuáles ya finalizaron y registrá la transferencia manual al creador.</p>
          </div>
          <div className="ac-stats">
            <div className="ac-stat-card">
              <span className="ac-stat-value">{stats.total}</span>
              <span className="ac-stat-label">Visibles</span>
            </div>
            <div className="ac-stat-card">
              <span className="ac-stat-value">{stats.ended}</span>
              <span className="ac-stat-label">Finalizadas</span>
            </div>
            <div className="ac-stat-card">
              <span className="ac-stat-value">{stats.ready}</span>
              <span className="ac-stat-label">Para transferir</span>
            </div>
          </div>
        </div>

        <div className="ac-toolbar">
          <div className="ac-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre de campaña"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="ac-toolbar-note">
            Ordenadas por fecha de cierre. Las campañas ya terminadas aparecen arriba.
          </div>
        </div>

        {error && <div className="ac-error">{error}</div>}
        {actionError && !transferData && <div className="ac-error">{actionError}</div>}

        {loading ? (
          <div className="ac-loading">Cargando campañas...</div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="ac-empty">
            <AlertCircle size={40} />
            <p>No se encontraron campañas con ese nombre.</p>
          </div>
        ) : (
          <div className="ac-list">
            {filteredCampaigns.map((campaign) => {
              const tone = getCampaignTone(campaign)
              const timeLeft = getCampaignTimeLeft(campaign.endDate)
              return (
                <article key={campaign.id} className={`ac-card ac-card--${tone}`}>
                  <div className="ac-card-main">
                    <div className="ac-card-top">
                      <div>
                        <h2>{campaign.title}</h2>
                        <p>{campaign.ownerName || 'Sin creador'} · {campaign.ownerEmail || 'Sin email'}</p>
                      </div>
                      <div className="ac-badges">
                        <span className={`ac-badge ac-badge--${tone}`}>
                          {getCampaignStatusText(campaign)}
                        </span>
                        {campaign.ended && (
                          <span className="ac-badge ac-badge--ended">Finalizó</span>
                        )}
                      </div>
                    </div>

                    <div className="ac-meta-grid">
                      <div className="ac-meta-card">
                        <CalendarClock size={16} />
                        <div>
                          <span>Fecha de cierre</span>
                          <strong>{formatDate(campaign.endDate)}</strong>
                          <small className="ac-meta-timeleft">{timeLeft.ended ? 'Finalizada' : `Faltan ${timeLeft.text}`}</small>
                        </div>
                      </div>
                      <div className="ac-meta-card">
                        <CircleDollarSign size={16} />
                        <div>
                          <span>Recaudado</span>
                          <strong>{formatCurrency(campaign.currentAmount)}</strong>
                        </div>
                      </div>
                      <div className="ac-meta-card">
                        <Wallet size={16} />
                        <div>
                          <span>Meta</span>
                          <strong>{formatCurrency(campaign.targetAmount)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ac-card-actions">
                    <div className="ac-action-stack">
                      <Button type="button" variant="ghost" onClick={() => openDetailModal(campaign.id)}>
                        <Info size={16} /> Ver detalle
                      </Button>
                      {campaign.transferCompleted ? (
                        <div className="ac-transfer-done">
                          <CheckCircle2 size={16} />
                          Transferencia registrada
                        </div>
                      ) : campaign.transferReady ? (
                        <Button type="button" variant="primary" onClick={() => openTransferModal(campaign)}>
                          Transferir al creador
                        </Button>
                      ) : (
                        <div className="ac-card-hint">
                          {campaign.ended
                            ? 'No requiere transferencia manual'
                            : 'Disponible al finalizar y cumplir la meta'}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {selectedCampaignId && (
        modalLoading ? (
          <div className="ac-modal-overlay">
            <div className="ac-modal ac-modal--loading">
              <div className="ac-loading">Preparando datos de transferencia...</div>
            </div>
          </div>
        ) : (
          <CampaignTransferModal
            transferData={transferData}
            actionLoading={actionLoading}
            actionError={actionError}
            transferReference={transferReference}
            onReferenceChange={setTransferReference}
            onClose={closeTransferModal}
            onConfirm={confirmTransfer}
          />
        )
      )}

      {(detailLoading || detailData) && (
        <CampaignDetailModal
          detailData={detailData}
          loading={detailLoading}
          onClose={closeDetailModal}
        />
      )}
    </div>
  )
}
