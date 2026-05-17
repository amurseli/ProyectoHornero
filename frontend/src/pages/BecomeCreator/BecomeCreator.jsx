import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Rocket, Upload, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, FileText, Camera, CreditCard, ShieldCheck } from 'lucide-react'
import { useUser } from '../../store/useUser'
import { Button } from '../../components/ui'
import api from '../../utils/api/api'
import './BecomeCreator.css'

const PROVINCES = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán'
]

const TAX_CONDITIONS = [
  { value: 'MONOTRIBUTISTA', label: 'Monotributista' },
  { value: 'RESPONSABLE_INSCRIPTO', label: 'Responsable Inscripto' },
  { value: 'CONSUMIDOR_FINAL', label: 'Consumidor Final / No inscripto' },
  { value: 'EXENTO', label: 'Exento' },
]

const STEP_LABELS = [
  'Datos personales',
  'Documentos de identidad',
  'Situación fiscal',
  'Datos bancarios',
  'Términos y condiciones',
]

/**
 * Multi-step creator verification form.
 * @param {{ onSuccess?: () => void }} props
 */
export function BecomeCreatorModule({ onSuccess }) {
  const { refreshUser } = useUser()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [existingStatus, setExistingStatus] = useState(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  // Step 1: Personal info
  const [personal, setPersonal] = useState({
    fullLegalName: '', dniNumber: '', cuilNumber: '', dateOfBirth: '',
    phoneNumber: '', addressStreet: '', addressCity: '', addressProvince: '', addressZipCode: ''
  })

  // Step 2: Documents
  const [documents, setDocuments] = useState({ DNI_FRONT: null, DNI_BACK: null, SELFIE_WITH_DNI: null })
  const [uploadStatus, setUploadStatus] = useState({ DNI_FRONT: null, DNI_BACK: null, SELFIE_WITH_DNI: null })

  // Step 3: Tax info
  const [tax, setTax] = useState({ taxCondition: '', cuitNumber: '' })

  // Step 4: Bank info
  const [bank, setBank] = useState({
    accountType: 'CBU', accountNumber: '', accountAlias: '',
    bankOrWalletName: '', accountHolderName: ''
  })

  // Step 5: Terms
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Check existing verification on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const data = await api.get('/api/users/me/verification')
        if (data && data.verificationStatus) {
          setExistingStatus(data)
        }
      } catch {
        // No existing verification
      } finally {
        setCheckingStatus(false)
      }
    }
    checkStatus()
  }, [])

  const updatePersonal = (field, value) => setPersonal(prev => ({ ...prev, [field]: value }))
  const updateTax = (field, value) => setTax(prev => ({ ...prev, [field]: value }))
  const updateBank = (field, value) => setBank(prev => ({ ...prev, [field]: value }))

  const handleFileChange = (docType, file) => {
    setDocuments(prev => ({ ...prev, [docType]: file }))
    setUploadStatus(prev => ({ ...prev, [docType]: null }))
  }

  const uploadDocument = async (docType) => {
    const file = documents[docType]
    if (!file) return

    const formData = new FormData()
    formData.append('documentType', docType)
    formData.append('file', file)

    setUploadStatus(prev => ({ ...prev, [docType]: 'uploading' }))
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
      const response = await fetch(`${BASE_URL}/api/users/me/verification/documents`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (!response.ok) {
        let errorMessage = `Error ${response.status}`
        try {
          const errData = await response.json()
          errorMessage = errData.message || errorMessage
        } catch {
          try { errorMessage = (await response.text()) || errorMessage } catch { /* noop */ }
        }
        throw new Error(errorMessage)
      }
      setUploadStatus(prev => ({ ...prev, [docType]: 'success' }))
    } catch (err) {
      setUploadStatus(prev => ({ ...prev, [docType]: 'error' }))
      setError(err.message)
    }
  }

  const allDocumentsUploaded = () =>
    uploadStatus.DNI_FRONT === 'success' &&
    uploadStatus.DNI_BACK === 'success' &&
    uploadStatus.SELFIE_WITH_DNI === 'success'

  const isBlank = (v) => !v || !String(v).trim()

  const validateStep = () => {
    setError(null)
    switch (step) {
      case 0: {
        const { fullLegalName, dniNumber, cuilNumber, dateOfBirth, phoneNumber, addressStreet, addressCity, addressProvince, addressZipCode } = personal
        if (isBlank(fullLegalName) || isBlank(dniNumber) || isBlank(cuilNumber) || !dateOfBirth || isBlank(phoneNumber) || isBlank(addressStreet) || isBlank(addressCity) || isBlank(addressProvince) || isBlank(addressZipCode)) {
          setError('Completá todos los campos obligatorios')
          return false
        }
        if (!/^\d{7,8}$/.test(dniNumber)) { setError('El DNI debe tener 7 u 8 dígitos'); return false }
        if (!/^\d{11}$/.test(cuilNumber)) { setError('El CUIL debe tener 11 dígitos'); return false }
        const dob = new Date(dateOfBirth)
        if (isNaN(dob.getTime())) { setError('Fecha de nacimiento inválida'); return false }
        const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
        if (dob >= startOfToday) { setError('La fecha de nacimiento debe ser en el pasado'); return false }
        return true
      }
      case 1:
        if (!allDocumentsUploaded()) {
          setError('Subí los 3 documentos requeridos antes de continuar')
          return false
        }
        return true
      case 2:
        if (!tax.taxCondition) { setError('Seleccioná tu condición fiscal'); return false }
        if ((tax.taxCondition === 'MONOTRIBUTISTA' || tax.taxCondition === 'RESPONSABLE_INSCRIPTO') && !tax.cuitNumber) {
          setError('El CUIT es obligatorio para Monotributistas y Responsables Inscriptos')
          return false
        }
        if (tax.cuitNumber && !/^\d{11}$/.test(tax.cuitNumber)) { setError('El CUIT debe tener 11 dígitos'); return false }
        return true
      case 3: {
        const { accountType, accountNumber, bankOrWalletName, accountHolderName } = bank
        if (!accountType) { setError('Seleccioná el tipo de cuenta'); return false }
        if (isBlank(accountNumber) || isBlank(bankOrWalletName) || isBlank(accountHolderName)) {
          setError('Completá todos los campos bancarios obligatorios')
          return false
        }
        if (!/^\d{22}$/.test(accountNumber)) { setError('El CBU/CVU debe tener 22 dígitos'); return false }
        return true
      }
      case 4:
        if (!termsAccepted) { setError('Debés aceptar los términos y condiciones'); return false }
        return true
      default: return true
    }
  }

  const nextStep = () => {
    if (validateStep()) setStep(prev => Math.min(prev + 1, STEP_LABELS.length - 1))
  }

  const prevStep = () => setStep(prev => Math.max(prev - 1, 0))

  const handleSubmit = async () => {
    if (!validateStep()) return

    setError(null)
    setLoading(true)

    try {
      const trim = (v) => (typeof v === 'string' ? v.trim() : v)
      const trimObj = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, trim(v)]))
      const payload = {
        ...trimObj(personal),
        ...trimObj(tax),
        cuitNumber: trim(tax.cuitNumber) || null,
        ...trimObj(bank),
        accountAlias: trim(bank.accountAlias) || null,
        termsAccepted,
      }
      await api.post('/api/users/me/verification', payload)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.message || 'Error al enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  if (checkingStatus) {
    return (
      <div className="become-creator-card">
        <p>Cargando...</p>
      </div>
    )
  }

  // Show status if already submitted
  if (existingStatus && existingStatus.verificationStatus) {
    const status = existingStatus.verificationStatus
    return (
      <div className="become-creator-card">
        <div className="become-creator-icon">
          {status === 'PENDING' && <ShieldCheck size={40} />}
          {status === 'APPROVED' && <CheckCircle size={40} />}
          {status === 'REJECTED' && <AlertCircle size={40} />}
        </div>
        <h1>
          {status === 'PENDING' && 'Verificación Pendiente'}
          {status === 'APPROVED' && '¡Verificación Aprobada!'}
          {status === 'REJECTED' && 'Verificación Rechazada'}
        </h1>
        <p>
          {status === 'PENDING' && 'Tu solicitud está siendo revisada por nuestro equipo. Te notificaremos cuando sea aprobada.'}
          {status === 'APPROVED' && 'Tu cuenta fue verificada. Ya podés crear campañas.'}
          {status === 'REJECTED' && `Tu solicitud fue rechazada. Motivo: ${existingStatus.rejectionReason || 'No especificado'}. Podés volver a intentar.`}
        </p>
        {status === 'REJECTED' && (
          <Button variant="primary" size="lg" onClick={() => setExistingStatus(null)}>
            Volver a intentar
          </Button>
        )}
        {status === 'APPROVED' && onSuccess && (
          <Button variant="primary" size="lg" onClick={onSuccess}>
            Ir a Mis Campañas
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="become-creator-card become-creator-card--wide">
      {/* Header */}
      <div className="become-creator-icon">
        <Rocket size={40} />
      </div>
      <h1>Convertite en Creador</h1>
      <p>Completá los siguientes pasos para verificar tu identidad y poder recibir fondos.</p>

      {/* Step indicator */}
      <div className="bc-steps-indicator">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className={`bc-step-dot ${i === step ? 'bc-step-dot--active' : ''} ${i < step ? 'bc-step-dot--done' : ''}`}>
            <span className="bc-step-number">{i < step ? '✓' : i + 1}</span>
            <span className="bc-step-label">{label}</span>
          </div>
        ))}
      </div>

      {error && <div className="become-creator-error">{error}</div>}

      {/* Step 1: Personal info */}
      {step === 0 && (
        <div className="bc-form-section">
          <h2>Datos Personales</h2>
          <div className="bc-form-grid">
            <div className="bc-form-field">
              <label>Nombre legal completo *</label>
              <input type="text" value={personal.fullLegalName} onChange={e => updatePersonal('fullLegalName', e.target.value)} placeholder="Como figura en tu DNI" />
            </div>
            <div className="bc-form-field">
              <label>Número de DNI *</label>
              <input type="text" value={personal.dniNumber} onChange={e => updatePersonal('dniNumber', e.target.value.replace(/\D/g, ''))} placeholder="Ej: 12345678" maxLength={8} />
            </div>
            <div className="bc-form-field">
              <label>Número de CUIL *</label>
              <input type="text" value={personal.cuilNumber} onChange={e => updatePersonal('cuilNumber', e.target.value.replace(/\D/g, ''))} placeholder="11 dígitos" maxLength={11} />
            </div>
            <div className="bc-form-field">
              <label>Fecha de nacimiento *</label>
              <input
                type="date"
                value={personal.dateOfBirth}
                max={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
                onChange={e => updatePersonal('dateOfBirth', e.target.value)}
              />
            </div>
            <div className="bc-form-field">
              <label>Teléfono *</label>
              <input type="text" value={personal.phoneNumber} onChange={e => updatePersonal('phoneNumber', e.target.value)} placeholder="Ej: +54 11 1234-5678" />
            </div>
            <div className="bc-form-field bc-form-field--full">
              <label>Dirección *</label>
              <input type="text" value={personal.addressStreet} onChange={e => updatePersonal('addressStreet', e.target.value)} placeholder="Calle y número" />
            </div>
            <div className="bc-form-field">
              <label>Ciudad *</label>
              <input type="text" value={personal.addressCity} onChange={e => updatePersonal('addressCity', e.target.value)} />
            </div>
            <div className="bc-form-field">
              <label>Provincia *</label>
              <select value={personal.addressProvince} onChange={e => updatePersonal('addressProvince', e.target.value)}>
                <option value="">Seleccionar...</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="bc-form-field">
              <label>Código postal *</label>
              <input type="text" value={personal.addressZipCode} onChange={e => updatePersonal('addressZipCode', e.target.value)} placeholder="Ej: 1425" />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Identity documents */}
      {step === 1 && (
        <div className="bc-form-section">
          <h2>Documentos de Identidad</h2>
          <p className="bc-section-desc">Subí fotos claras de tu DNI y una selfie sosteniéndolo.</p>

          {[
            { type: 'DNI_FRONT', label: 'DNI Frente', icon: <FileText size={20} /> },
            { type: 'DNI_BACK', label: 'DNI Dorso', icon: <FileText size={20} /> },
            { type: 'SELFIE_WITH_DNI', label: 'Selfie con DNI', icon: <Camera size={20} /> },
          ].map(({ type, label, icon }) => (
            <div key={type} className="bc-upload-row">
              <div className="bc-upload-info">
                {icon}
                <span>{label}</span>
                {uploadStatus[type] === 'success' && <CheckCircle size={18} className="bc-upload-success" />}
                {uploadStatus[type] === 'error' && <AlertCircle size={18} className="bc-upload-error-icon" />}
              </div>
              <div className="bc-upload-actions">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  id={`file-${type}`}
                  className="bc-file-input"
                  onChange={e => handleFileChange(type, e.target.files[0])}
                />
                <label htmlFor={`file-${type}`} className="bc-file-label">
                  <Upload size={14} /> {documents[type] ? documents[type].name : 'Elegir archivo'}
                </label>
                {documents[type] && uploadStatus[type] !== 'success' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => uploadDocument(type)}
                    disabled={uploadStatus[type] === 'uploading'}
                  >
                    {uploadStatus[type] === 'uploading' ? 'Subiendo...' : 'Subir'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 3: Tax situation */}
      {step === 2 && (
        <div className="bc-form-section">
          <h2>Situación Fiscal</h2>
          <p className="bc-section-desc">Necesitamos conocer tu situación ante AFIP. Recordá que como creador sos responsable de tus propias obligaciones fiscales.</p>
          <div className="bc-form-grid">
            <div className="bc-form-field bc-form-field--full">
              <label>Condición ante AFIP *</label>
              <select value={tax.taxCondition} onChange={e => updateTax('taxCondition', e.target.value)}>
                <option value="">Seleccionar...</option>
                {TAX_CONDITIONS.map(tc => <option key={tc.value} value={tc.value}>{tc.label}</option>)}
              </select>
            </div>
            {(tax.taxCondition === 'MONOTRIBUTISTA' || tax.taxCondition === 'RESPONSABLE_INSCRIPTO') && (
              <div className="bc-form-field bc-form-field--full">
                <label>Número de CUIT *</label>
                <input type="text" value={tax.cuitNumber} onChange={e => updateTax('cuitNumber', e.target.value.replace(/\D/g, ''))} placeholder="11 dígitos" maxLength={11} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Bank info */}
      {step === 3 && (
        <div className="bc-form-section">
          <h2>Datos Bancarios</h2>
          <p className="bc-section-desc">Ingresá tu CBU o CVU para poder recibir los fondos de tus campañas.</p>
          <div className="bc-form-grid">
            <div className="bc-form-field">
              <label>Tipo de cuenta *</label>
              <select value={bank.accountType} onChange={e => updateBank('accountType', e.target.value)}>
                <option value="CBU">CBU (Cuenta bancaria)</option>
                <option value="CVU">CVU (Billetera virtual)</option>
              </select>
            </div>
            <div className="bc-form-field">
              <label>{bank.accountType} (22 dígitos) *</label>
              <input type="text" value={bank.accountNumber} onChange={e => updateBank('accountNumber', e.target.value.replace(/\D/g, ''))} placeholder="22 dígitos" maxLength={22} />
            </div>
            <div className="bc-form-field">
              <label>Alias (opcional)</label>
              <input type="text" value={bank.accountAlias} onChange={e => updateBank('accountAlias', e.target.value)} placeholder="Ej: mi.alias.mp" />
            </div>
            <div className="bc-form-field">
              <label>Banco / Billetera *</label>
              <input type="text" value={bank.bankOrWalletName} onChange={e => updateBank('bankOrWalletName', e.target.value)} placeholder="Ej: Mercado Pago, Brubank" />
            </div>
            <div className="bc-form-field bc-form-field--full">
              <label>Nombre del titular *</label>
              <input type="text" value={bank.accountHolderName} onChange={e => updateBank('accountHolderName', e.target.value)} placeholder="Debe coincidir con tu identidad verificada" />
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Terms */}
      {step === 4 && (
        <div className="bc-form-section">
          <h2>Términos y Condiciones</h2>
          <div className="bc-terms-box">
            <p>Al aceptar, declarás que:</p>
            <ul>
              <li>La información proporcionada es veraz y completa (Declaración Jurada).</li>
              <li>Sos responsable de tus propias obligaciones fiscales.</li>
              <li>La plataforma puede retener una comisión sobre los fondos recibidos.</li>
              <li>Los fondos de campañas pueden estar sujetos a un período de retención antes del retiro.</li>
              <li>La plataforma puede compartir información con autoridades si es legalmente requerido.</li>
              <li>Aceptás la Política de Privacidad conforme a la Ley 25.326.</li>
            </ul>
          </div>
          <label className="bc-checkbox-row">
            <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} />
            <span>Acepto los términos y condiciones y la política de privacidad</span>
          </label>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="bc-nav-buttons">
        {step > 0 && (
          <Button variant="ghost" onClick={prevStep}>
            <ChevronLeft size={16} /> Anterior
          </Button>
        )}
        <div className="bc-nav-spacer" />
        {step < STEP_LABELS.length - 1 ? (
          <Button variant="primary" onClick={nextStep}>
            Siguiente <ChevronRight size={16} />
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Solicitud'}
          </Button>
        )}
      </div>
    </div>
  )
}

function BecomeCreator() {
  const navigate = useNavigate()

  return (
    <div className="become-creator-page">
      <BecomeCreatorModule onSuccess={() => navigate('/campaigns')} />
    </div>
  )
}

export default BecomeCreator
