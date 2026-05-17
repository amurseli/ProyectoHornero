import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, CheckCircle, XCircle, Eye, ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-react'
import { useUser } from '../../store/useUser'
import { Button } from '../../components/ui'
import api from '../../utils/api/api'
import './AdminVerifications.css'

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
}

const TAX_LABELS = {
  MONOTRIBUTISTA: 'Monotributista',
  RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
  CONSUMIDOR_FINAL: 'Consumidor Final',
  EXENTO: 'Exento',
}

const DOC_LABELS = {
  DNI_FRONT: 'DNI Frente',
  DNI_BACK: 'DNI Dorso',
  SELFIE_WITH_DNI: 'Selfie con DNI',
}

function AdminVerifications() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('PENDING')
  const [expandedId, setExpandedId] = useState(null)
  const [documentUrls, setDocumentUrls] = useState({})
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    if (!user) return
    if (user?.role !== 'ADMIN') {
      navigate('/')
      return
    }
    fetchVerifications()
  }, [filter, user])

  const fetchVerifications = async () => {
    setLoading(true)
    setError(null)
    try {
      const queryParam = filter ? `?status=${filter}` : ''
      const data = await api.get(`/api/admin/verifications${queryParam}`)
      setVerifications(data)
    } catch (err) {
      setError(err.message || 'Error al cargar verificaciones')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
    setRejectionReason('')
    setActionError(null)
  }

  const loadDocumentUrl = async (documentId) => {
    if (documentUrls[documentId]) return
    try {
      const data = await api.get(`/api/admin/verifications/documents/${documentId}/url`)
      setDocumentUrls(prev => ({ ...prev, [documentId]: data.url }))
    } catch (err) {
      console.error('Error loading document URL:', err)
    }
  }

  const handleDecision = async (verificationId, decision) => {
    if (decision === 'REJECTED' && !rejectionReason.trim()) {
      setActionError('Debés ingresar un motivo de rechazo')
      return
    }

    setActionLoading(verificationId)
    setActionError(null)
    try {
      await api.post(`/api/admin/verifications/${verificationId}/decision`, {
        decision,
        rejectionReason: decision === 'REJECTED' ? rejectionReason : null,
      })
      // Refresh list
      fetchVerifications()
      setExpandedId(null)
      setRejectionReason('')
    } catch (err) {
      setActionError(err.message || 'Error al procesar la decisión')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} className="av-status-icon av-status-icon--pending" />
      case 'APPROVED': return <CheckCircle size={16} className="av-status-icon av-status-icon--approved" />
      case 'REJECTED': return <XCircle size={16} className="av-status-icon av-status-icon--rejected" />
      default: return null
    }
  }

  return (
    <div className="admin-verifications-page">
      <div className="av-container">
        <div className="av-header">
          <div className="av-header-icon">
            <ShieldCheck size={28} />
          </div>
          <h1>Verificaciones de Creadores</h1>
          <p>Revisá las solicitudes de verificación de identidad de los creadores.</p>
        </div>

        {/* Filters */}
        <div className="av-filters">
          {['PENDING', '', 'APPROVED', 'REJECTED'].map(f => (
            <button
              key={f}
              className={`av-filter-btn ${filter === f ? 'av-filter-btn--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === '' ? 'Todos' : STATUS_LABELS[f] || f}
            </button>
          ))}
        </div>

        {error && <div className="av-error">{error}</div>}

        {loading ? (
          <div className="av-loading">Cargando verificaciones...</div>
        ) : verifications.length === 0 ? (
          <div className="av-empty">
            <AlertCircle size={40} />
            <p>No hay verificaciones {filter ? STATUS_LABELS[filter]?.toLowerCase() + 's' : ''}.</p>
          </div>
        ) : (
          <div className="av-list">
            {verifications.map(v => (
              <div key={v.id} className={`av-card ${expandedId === v.id ? 'av-card--expanded' : ''}`}>
                {/* Summary row */}
                <div className="av-card-header" onClick={() => toggleExpand(v.id)}>
                  <div className="av-card-user">
                    <strong>{v.fullLegalName}</strong>
                    <span className="av-card-email">{v.email}</span>
                  </div>
                  <div className="av-card-meta">
                    <span className={`av-status-badge av-status-badge--${v.verificationStatus.toLowerCase()}`}>
                      {getStatusIcon(v.verificationStatus)}
                      {STATUS_LABELS[v.verificationStatus]}
                    </span>
                    <span className="av-card-date">{new Date(v.createdAt).toLocaleDateString('es-AR')}</span>
                    {expandedId === v.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === v.id && (
                  <div className="av-card-detail">
                    <div className="av-detail-grid">
                      <div className="av-detail-section">
                        <h3>Datos Personales</h3>
                        <dl>
                          <dt>Nombre legal</dt><dd>{v.fullLegalName}</dd>
                          <dt>DNI</dt><dd>{v.dniNumberMasked}</dd>
                          <dt>CUIL</dt><dd>{v.cuilNumberMasked}</dd>
                          {v.cuitNumberMasked && <><dt>CUIT</dt><dd>{v.cuitNumberMasked}</dd></>}
                          <dt>Fecha de nacimiento</dt><dd>{v.dateOfBirth}</dd>
                          <dt>Teléfono</dt><dd>{v.phoneNumber}</dd>
                        </dl>
                      </div>

                      <div className="av-detail-section">
                        <h3>Dirección</h3>
                        <dl>
                          <dt>Calle</dt><dd>{v.addressStreet}</dd>
                          <dt>Ciudad</dt><dd>{v.addressCity}</dd>
                          <dt>Provincia</dt><dd>{v.addressProvince}</dd>
                          <dt>Código postal</dt><dd>{v.addressZipCode}</dd>
                        </dl>
                      </div>

                      <div className="av-detail-section">
                        <h3>Situación Fiscal</h3>
                        <dl>
                          <dt>Condición</dt><dd>{TAX_LABELS[v.taxCondition] || v.taxCondition}</dd>
                        </dl>
                      </div>

                      <div className="av-detail-section">
                        <h3>Datos Bancarios</h3>
                        <dl>
                          <dt>Tipo</dt><dd>{v.accountType}</dd>
                          <dt>Número</dt><dd>{v.accountNumberMasked}</dd>
                          {v.accountAlias && <><dt>Alias</dt><dd>{v.accountAlias}</dd></>}
                          <dt>Banco/Billetera</dt><dd>{v.bankOrWalletName}</dd>
                          <dt>Titular</dt><dd>{v.accountHolderName}</dd>
                        </dl>
                      </div>
                    </div>

                    {/* Documents */}
                    {v.documents && v.documents.length > 0 && (
                      <div className="av-detail-section av-docs-section">
                        <h3>Documentos de Identidad</h3>
                        <div className="av-docs-grid">
                          {v.documents.map((doc) => (
                            <div key={doc.id} className="av-doc-item">
                              <span>{DOC_LABELS[doc.documentType] || doc.documentType}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => loadDocumentUrl(doc.id)}
                              >
                                <Eye size={14} /> Ver
                              </Button>
                              {documentUrls[doc.id] && (
                                <a
                                  href={documentUrls[doc.id]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="av-doc-link"
                                >
                                  Abrir en nueva pestaña
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons (only for PENDING) */}
                    {v.verificationStatus === 'PENDING' && (
                      <div className="av-actions">
                        {actionError && <div className="av-action-error">{actionError}</div>}

                        <div className="av-rejection-input">
                          <input
                            type="text"
                            placeholder="Motivo de rechazo (obligatorio para rechazar)"
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                          />
                        </div>

                        <div className="av-action-buttons">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDecision(v.id, 'REJECTED')}
                            disabled={actionLoading === v.id}
                          >
                            <XCircle size={16} /> Rechazar
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleDecision(v.id, 'APPROVED')}
                            disabled={actionLoading === v.id}
                          >
                            <CheckCircle size={16} /> Aprobar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Show rejection info if rejected */}
                    {v.verificationStatus === 'REJECTED' && v.rejectionReason && (
                      <div className="av-rejection-info">
                        <strong>Motivo de rechazo:</strong> {v.rejectionReason}
                        <br />
                        <small>Rechazado por {v.verifiedBy} el {new Date(v.verifiedAt).toLocaleDateString('es-AR')}</small>
                      </div>
                    )}

                    {v.verificationStatus === 'APPROVED' && (
                      <div className="av-approved-info">
                        <CheckCircle size={16} />
                        <span>Aprobado por {v.verifiedBy} el {new Date(v.verifiedAt).toLocaleDateString('es-AR')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminVerifications