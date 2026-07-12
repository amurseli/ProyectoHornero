import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Rocket, Upload, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, FileText, Camera, CreditCard, ShieldCheck } from 'lucide-react'
import { useUser } from '../../store/useUser'
import { Button } from '../../components/ui'
import api from '../../utils/api/api'
import ImageCropModal from '../../components/ImageCropModal/ImageCropModal'
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

// Aspecto de recorte por documento. El recorte reescala la foto a ~1600px de
// ancho y la exporta como JPEG, lo que baja mucho el peso del archivo y evita
// el error 413 al subir fotos de celular (que suelen superar el límite).
const DOC_ASPECT = {
  DNI_FRONT: 856 / 540,   // proporción de la tarjeta del DNI (ID-1)
  DNI_BACK: 856 / 540,
  SELFIE_WITH_DNI: 3 / 4, // selfie vertical
}

const DOC_TYPES = ['DNI_FRONT', 'DNI_BACK', 'SELFIE_WITH_DNI']

// Texto del recortador según el documento: guiamos al usuario para que la foto
// sea usable (números del DNI legibles / cara visible en la selfie).
const DOC_CROP_TEXT = {
  DNI_FRONT: {
    title: 'Encuadrá el frente del DNI',
    description: 'Que se vea nítido y completo, sin reflejos ni sombras. Asegurate de que el número de documento se lea con claridad.',
  },
  DNI_BACK: {
    title: 'Encuadrá el dorso del DNI',
    description: 'Que se vea nítido y completo, sin reflejos ni sombras. Los datos y el número tienen que leerse con claridad.',
  },
  SELFIE_WITH_DNI: {
    title: 'Encuadrá tu selfie con el DNI',
    description: 'Tu cara tiene que verse claramente y el DNI legible en la misma foto. Buena luz, sin reflejos ni recortes.',
  },
}

// Tamaño máximo por foto. Debe coincidir con el límite del backend
// (spring.servlet.multipart.max-file-size / MAX_UPLOAD_FILE_SIZE, 15MB por
// defecto). Configurable con VITE_MAX_UPLOAD_MB.
const MAX_UPLOAD_MB = Number(import.meta.env.VITE_MAX_UPLOAD_MB) || 15
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

/**
 * Multi-step creator verification form.
 * @param {{ onSuccess?: () => void }} props
 */
export function BecomeCreatorModule({ onSuccess }) {
  const { refreshUser } = useUser()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
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
  const [previews, setPreviews] = useState({ DNI_FRONT: null, DNI_BACK: null, SELFIE_WITH_DNI: null })
  const [cropTarget, setCropTarget] = useState(null) // { docType, src }
  const [uploadingAll, setUploadingAll] = useState(false)

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

  // Una vez que un campo ya mostró error, lo re-validamos en cada tecla para que
  // el mensaje desaparezca apenas se corrige (sin esperar a perder el foco).
  const revalidateIfShown = (field, value) => {
    setFieldErrors(prev => (prev[field] ? { ...prev, [field]: validateField(field, value) } : prev))
  }
  const updatePersonal = (field, value) => { setPersonal(prev => ({ ...prev, [field]: value })); revalidateIfShown(field, value) }
  const updateTax = (field, value) => { setTax(prev => ({ ...prev, [field]: value })); revalidateIfShown(field, value) }
  const updateBank = (field, value) => { setBank(prev => ({ ...prev, [field]: value })); revalidateIfShown(field, value) }

  // Al elegir una foto no la guardamos tal cual: abrimos el recortador para que
  // el usuario la encuadre y, de paso, se reescale/comprima a un tamaño acorde
  // al límite (evita el 413).
  const handleFileChange = (docType, file) => {
    if (!file) return
    setCropTarget({ docType, src: URL.createObjectURL(file) })
  }

  const handleCropConfirm = ({ file, previewUrl }) => {
    const docType = cropTarget?.docType
    if (!docType) return
    setDocuments(prev => ({ ...prev, [docType]: file }))
    setPreviews(prev => {
      if (prev[docType]) URL.revokeObjectURL(prev[docType])
      return { ...prev, [docType]: previewUrl }
    })
    setUploadStatus(prev => ({ ...prev, [docType]: null }))
    if (cropTarget?.src) URL.revokeObjectURL(cropTarget.src)
    setCropTarget(null)
  }

  const handleCropCancel = () => {
    if (cropTarget?.src) URL.revokeObjectURL(cropTarget.src)
    setCropTarget(null)
  }

  const uploadDocument = async (docType) => {
    const file = documents[docType]
    if (!file) return false

    // Mismo límite que aplica el backend (evita mandar un request que caería con 413).
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadStatus(prev => ({ ...prev, [docType]: 'error' }))
      setError(`La foto supera el máximo de ${MAX_UPLOAD_MB}MB.`)
      return false
    }

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
      return true
    } catch (err) {
      setUploadStatus(prev => ({ ...prev, [docType]: 'error' }))
      setError(err.message)
      return false
    }
  }

  // Un solo botón: sube las 3 fotos (las que aún no estén subidas) en una tanda.
  const uploadAllDocuments = async () => {
    setError(null)
    if (DOC_TYPES.some(t => !documents[t])) {
      setError('Elegí las 3 fotos requeridas antes de subir')
      return
    }
    setUploadingAll(true)
    try {
      for (const t of DOC_TYPES) {
        if (uploadStatus[t] !== 'success') {
          const ok = await uploadDocument(t)
          if (!ok) break
        }
      }
    } finally {
      setUploadingAll(false)
    }
  }

  const allDocumentsUploaded = () =>
    DOC_TYPES.every(t => uploadStatus[t] === 'success')

  const isBlank = (v) => !v || !String(v).trim()

  // Validación por campo, alineada con las reglas del backend
  // (CreatorVerificationRequest). Devuelve el mensaje de error o '' si es válido.
  const validateField = (name, value) => {
    const v = typeof value === 'string' ? value.trim() : value
    switch (name) {
      case 'fullLegalName': return v ? '' : 'El nombre legal completo es obligatorio'
      case 'dniNumber':
        if (!v) return 'El número de DNI es obligatorio'
        return /^\d{7,8}$/.test(v) ? '' : 'El DNI debe tener 7 u 8 dígitos'
      case 'cuilNumber':
        if (!v) return 'El número de CUIL es obligatorio'
        return /^\d{11}$/.test(v) ? '' : 'El CUIL debe tener 11 dígitos'
      case 'dateOfBirth': {
        if (!v) return 'La fecha de nacimiento es obligatoria'
        const dob = new Date(v)
        if (isNaN(dob.getTime())) return 'Fecha de nacimiento inválida'
        const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
        return dob < startOfToday ? '' : 'La fecha de nacimiento debe ser en el pasado'
      }
      case 'phoneNumber': return v ? '' : 'El teléfono es obligatorio'
      case 'addressStreet': return v ? '' : 'La dirección es obligatoria'
      case 'addressCity': return v ? '' : 'La ciudad es obligatoria'
      case 'addressProvince': return v ? '' : 'La provincia es obligatoria'
      case 'addressZipCode': return v ? '' : 'El código postal es obligatorio'
      case 'taxCondition': return v ? '' : 'La condición fiscal es obligatoria'
      case 'cuitNumber':
        if (!v) {
          return (tax.taxCondition === 'MONOTRIBUTISTA' || tax.taxCondition === 'RESPONSABLE_INSCRIPTO')
            ? 'El CUIT es obligatorio para Monotributistas y Responsables Inscriptos' : ''
        }
        return /^\d{11}$/.test(v) ? '' : 'El CUIT debe tener 11 dígitos'
      case 'accountNumber':
        if (!v) return 'El número de cuenta es obligatorio'
        return /^\d{22}$/.test(v) ? '' : 'El CBU/CVU debe tener 22 dígitos'
      case 'bankOrWalletName': return v ? '' : 'El nombre del banco o billetera es obligatorio'
      case 'accountHolderName': return v ? '' : 'El nombre del titular es obligatorio'
      default: return ''
    }
  }

  // Valida un campo al perder el foco (blur).
  const handleBlur = (name, value) => {
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
  }

  const errCls = (name) => (fieldErrors[name] ? 'bc-input-error' : undefined)
  const fieldErr = (name) => (fieldErrors[name]
    ? <span className="bc-field-error">{fieldErrors[name]}</span>
    : null)

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
              <input type="text" className={errCls('fullLegalName')} maxLength={255} value={personal.fullLegalName} onChange={e => updatePersonal('fullLegalName', e.target.value)} onBlur={e => handleBlur('fullLegalName', e.target.value)} placeholder="Como figura en tu DNI" />
              {fieldErr('fullLegalName')}
            </div>
            <div className="bc-form-field">
              <label>Número de DNI *</label>
              <input type="text" className={errCls('dniNumber')} value={personal.dniNumber} onChange={e => updatePersonal('dniNumber', e.target.value.replace(/\D/g, ''))} onBlur={e => handleBlur('dniNumber', e.target.value)} placeholder="Ej: 12345678" maxLength={8} />
              {fieldErr('dniNumber')}
            </div>
            <div className="bc-form-field">
              <label>Número de CUIL *</label>
              <input type="text" className={errCls('cuilNumber')} value={personal.cuilNumber} onChange={e => updatePersonal('cuilNumber', e.target.value.replace(/\D/g, ''))} onBlur={e => handleBlur('cuilNumber', e.target.value)} placeholder="11 dígitos" maxLength={11} />
              {fieldErr('cuilNumber')}
            </div>
            <div className="bc-form-field">
              <label>Fecha de nacimiento *</label>
              <input
                type="date"
                className={errCls('dateOfBirth')}
                value={personal.dateOfBirth}
                max={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
                onChange={e => updatePersonal('dateOfBirth', e.target.value)}
                onBlur={e => handleBlur('dateOfBirth', e.target.value)}
              />
              {fieldErr('dateOfBirth')}
            </div>
            <div className="bc-form-field">
              <label>Teléfono *</label>
              <input type="text" className={errCls('phoneNumber')} maxLength={30} value={personal.phoneNumber} onChange={e => updatePersonal('phoneNumber', e.target.value)} onBlur={e => handleBlur('phoneNumber', e.target.value)} placeholder="Ej: +54 11 1234-5678" />
              {fieldErr('phoneNumber')}
            </div>
            <div className="bc-form-field bc-form-field--full">
              <label>Dirección *</label>
              <input type="text" className={errCls('addressStreet')} maxLength={255} value={personal.addressStreet} onChange={e => updatePersonal('addressStreet', e.target.value)} onBlur={e => handleBlur('addressStreet', e.target.value)} placeholder="Calle y número" />
              {fieldErr('addressStreet')}
            </div>
            <div className="bc-form-field">
              <label>Ciudad *</label>
              <input type="text" className={errCls('addressCity')} maxLength={100} value={personal.addressCity} onChange={e => updatePersonal('addressCity', e.target.value)} onBlur={e => handleBlur('addressCity', e.target.value)} />
              {fieldErr('addressCity')}
            </div>
            <div className="bc-form-field">
              <label>Provincia *</label>
              <select className={errCls('addressProvince')} value={personal.addressProvince} onChange={e => updatePersonal('addressProvince', e.target.value)} onBlur={e => handleBlur('addressProvince', e.target.value)}>
                <option value="">Seleccionar...</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {fieldErr('addressProvince')}
            </div>
            <div className="bc-form-field">
              <label>Código postal *</label>
              <input type="text" className={errCls('addressZipCode')} maxLength={20} value={personal.addressZipCode} onChange={e => updatePersonal('addressZipCode', e.target.value)} onBlur={e => handleBlur('addressZipCode', e.target.value)} placeholder="Ej: 1425" />
              {fieldErr('addressZipCode')}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Identity documents */}
      {step === 1 && (
        <div className="bc-form-section">
          <h2>Documentos de Identidad</h2>
          <p className="bc-section-desc">
            Subí fotos claras de tu DNI y una selfie sosteniéndolo. Al elegir cada
            foto vas a poder encuadrarla; se optimiza automáticamente para subirla.
          </p>

          {[
            { type: 'DNI_FRONT', label: 'DNI Frente', icon: <FileText size={20} /> },
            { type: 'DNI_BACK', label: 'DNI Dorso', icon: <FileText size={20} /> },
            { type: 'SELFIE_WITH_DNI', label: 'Selfie con DNI', icon: <Camera size={20} /> },
          ].map(({ type, label, icon }) => (
            <div key={type} className="bc-upload-row">
              <div className="bc-upload-info">
                {previews[type]
                  ? <img src={previews[type]} alt={label} className="bc-upload-preview" />
                  : icon}
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
                  onChange={e => { handleFileChange(type, e.target.files[0]); e.target.value = '' }}
                />
                <label htmlFor={`file-${type}`} className="bc-file-label">
                  <Upload size={14} /> {documents[type] ? 'Cambiar foto' : 'Elegir archivo'}
                </label>
              </div>
            </div>
          ))}

          <div className="bc-upload-submit">
            <Button
              variant="primary"
              size="md"
              onClick={uploadAllDocuments}
              disabled={uploadingAll || allDocumentsUploaded() || DOC_TYPES.some(t => !documents[t])}
            >
              <Upload size={16} />
              {uploadingAll ? 'Subiendo...' : allDocumentsUploaded() ? 'Documentos subidos' : 'Subir documentos'}
            </Button>
          </div>

          {cropTarget && (
            <ImageCropModal
              src={cropTarget.src}
              aspect={DOC_ASPECT[cropTarget.docType] ?? 856 / 540}
              fileName={`${cropTarget.docType.toLowerCase()}.jpg`}
              maxBytes={MAX_UPLOAD_BYTES}
              title={DOC_CROP_TEXT[cropTarget.docType]?.title}
              description={DOC_CROP_TEXT[cropTarget.docType]?.description}
              onCancel={handleCropCancel}
              onConfirm={handleCropConfirm}
            />
          )}
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
              <select className={errCls('taxCondition')} value={tax.taxCondition} onChange={e => updateTax('taxCondition', e.target.value)} onBlur={e => handleBlur('taxCondition', e.target.value)}>
                <option value="">Seleccionar...</option>
                {TAX_CONDITIONS.map(tc => <option key={tc.value} value={tc.value}>{tc.label}</option>)}
              </select>
              {fieldErr('taxCondition')}
            </div>
            {(tax.taxCondition === 'MONOTRIBUTISTA' || tax.taxCondition === 'RESPONSABLE_INSCRIPTO') && (
              <div className="bc-form-field bc-form-field--full">
                <label>Número de CUIT *</label>
                <input type="text" className={errCls('cuitNumber')} value={tax.cuitNumber} onChange={e => updateTax('cuitNumber', e.target.value.replace(/\D/g, ''))} onBlur={e => handleBlur('cuitNumber', e.target.value)} placeholder="11 dígitos" maxLength={11} />
                {fieldErr('cuitNumber')}
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
              <input type="text" className={errCls('accountNumber')} value={bank.accountNumber} onChange={e => updateBank('accountNumber', e.target.value.replace(/\D/g, ''))} onBlur={e => handleBlur('accountNumber', e.target.value)} placeholder="22 dígitos" maxLength={22} />
              {fieldErr('accountNumber')}
            </div>
            <div className="bc-form-field">
              <label>Alias (opcional)</label>
              <input type="text" maxLength={100} value={bank.accountAlias} onChange={e => updateBank('accountAlias', e.target.value)} placeholder="Ej: mi.alias.mp" />
            </div>
            <div className="bc-form-field">
              <label>Banco / Billetera *</label>
              <input type="text" className={errCls('bankOrWalletName')} maxLength={100} value={bank.bankOrWalletName} onChange={e => updateBank('bankOrWalletName', e.target.value)} onBlur={e => handleBlur('bankOrWalletName', e.target.value)} placeholder="Ej: Mercado Pago, Brubank" />
              {fieldErr('bankOrWalletName')}
            </div>
            <div className="bc-form-field bc-form-field--full">
              <label>Nombre del titular *</label>
              <input type="text" className={errCls('accountHolderName')} maxLength={255} value={bank.accountHolderName} onChange={e => updateBank('accountHolderName', e.target.value)} onBlur={e => handleBlur('accountHolderName', e.target.value)} placeholder="Debe coincidir con tu identidad verificada" />
              {fieldErr('accountHolderName')}
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
      <BecomeCreatorModule onSuccess={() => navigate('/my-campaigns')} />
    </div>
  )
}

export default BecomeCreator
