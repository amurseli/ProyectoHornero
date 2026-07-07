import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, X, AlertTriangle, Rocket, ShieldCheck, Info, CheckCircle, Upload, User as UserIcon, CircleUserRound } from 'lucide-react'
import { useUser } from '../../store/useUser'
import { Button } from '../../components/ui'
import ImageCropModal from '../../components/ImageCropModal/ImageCropModal'
import PasswordRequirements from '../../components/PasswordRequirements/PasswordRequirements'
import { evaluatePassword } from '../../utils/passwordPolicy'
import api from '../../utils/api/api'
import { getEntityImageSrc } from '../../utils/imageSources'
import './UserConfig.css'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

const GENDER_OPTIONS = [
  { value: '', label: 'Seleccionar...' },
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Femenino' },
  { value: 'NON_BINARY', label: 'No binario' },
  { value: 'OTHER', label: 'Otro' },
  { value: 'PREFER_NOT_SAY', label: 'Prefiero no decir' },
]

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function UserConfig() {
  const navigate = useNavigate()
  const { user, refreshUser } = useUser()

  // Profile form state
  const [profile, setProfile] = useState({
    userName: '',
    firstName: '',
    lastName: '',
    gender: '',
    phone: '',
    avatarUrl: '',
    avatarSource: 'NONE',
    avatarBase64: null,
    removeAvatar: false,
  })
  const [currentEmail, setCurrentEmail] = useState('')
  const [pendingEmail, setPendingEmail] = useState(null)
  const [oauthProvider, setOauthProvider] = useState(null)

  // Email change state
  const [newEmail, setNewEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState(null)
  const [emailLoading, setEmailLoading] = useState(false)

  // Connections state
  const [connections, setConnections] = useState([])
  const [connectionMsg, setConnectionMsg] = useState(null)
  const [connectionLoading, setConnectionLoading] = useState(false)
  const [unlinkConfirm, setUnlinkConfirm] = useState(null) // provider name or null

  // Password form state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

  const isNewPasswordValid = evaluatePassword(passwords.newPassword).allValid

  const [profileMsg, setProfileMsg] = useState(null)
  const [passwordMsg, setPasswordMsg] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [verification, setVerification] = useState(undefined)
  const [avatarCropSrc, setAvatarCropSrc] = useState(null)

  // Load full profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api.get('/api/users/me/profile')
        setProfile({
          userName: data.userName || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          gender: data.gender || '',
          phone: data.phone || '',
          avatarUrl: data.avatarUrl || '',
          avatarSource: data.avatarSource || 'NONE',
          avatarBase64: null,
          removeAvatar: false,
        })
        setCurrentEmail(data.email || '')
        setPendingEmail(data.pendingEmail || null)
        setOauthProvider(data.oauthProvider || null)
      } catch {
        if (user) {
          setProfile(prev => ({
            ...prev,
            userName: user.userName || '',
            firstName: user.firstName || '',
            avatarUrl: user.avatarUrl || '',
          }))
        }
      } finally {
        setInitialLoading(false)
      }
    }
    loadProfile()
  }, [user])

  // Load verification status for non-creator users
  useEffect(() => {
    if (user?.role === 'CREATOR' || user?.role === 'ADMIN') return
    api.get('/api/users/me/verification')
      .then(data => setVerification(data))
      .catch(() => setVerification(null))
  }, [user])

  // Load connections
  useEffect(() => {
    loadConnections()
  }, [])

  async function loadConnections() {
    try {
      const data = await api.get('/api/users/me/connections')
      setConnections(data || [])
    } catch {
      setConnections([])
    }
  }

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handleAvatarPick = (files) => {
    const file = files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setProfileMsg({ type: 'error', text: 'La foto de perfil tiene que ser una imagen.' })
      return
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setProfileMsg({ type: 'error', text: 'La foto de perfil no puede superar los 10 MB.' })
      return
    }

    setProfileMsg(null)
    setAvatarCropSrc(URL.createObjectURL(file))
  }

  const handleAvatarRemove = () => {
    setProfile(prev => ({
      ...prev,
      avatarBase64: null,
      avatarUrl: prev.avatarSource === 'OAUTH' ? prev.avatarUrl : '',
      removeAvatar: prev.avatarSource === 'CUSTOM',
      avatarSource: prev.avatarSource === 'CUSTOM' ? 'NONE' : prev.avatarSource,
    }))
  }

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value })
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileMsg(null)
    setProfileLoading(true)

    try {
      const data = await api.put('/api/users/me/profile', {
        userName: profile.userName,
        firstName: profile.firstName,
        lastName: profile.lastName,
        gender: profile.gender,
        phone: profile.phone,
        avatarBase64: profile.avatarBase64,
        removeAvatar: profile.removeAvatar,
      })
      setProfile({
        userName: data.userName || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        gender: data.gender || '',
        phone: data.phone || '',
        avatarUrl: data.avatarUrl || '',
        avatarSource: data.avatarSource || 'NONE',
        avatarBase64: null,
        removeAvatar: false,
      })
      if (refreshUser) await refreshUser()
      setProfileMsg({ type: 'success', text: 'Perfil actualizado correctamente.' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Error al actualizar el perfil.' })
    } finally {
      setProfileLoading(false)
    }
  }

  const handleEmailChangeSubmit = async (e) => {
    e.preventDefault()
    setEmailMsg(null)

    if (!newEmail || !newEmail.includes('@')) {
      setEmailMsg({ type: 'error', text: 'Ingresá un email válido.' })
      return
    }

    if (newEmail === currentEmail) {
      setEmailMsg({ type: 'error', text: 'El nuevo email es igual al actual.' })
      return
    }

    setEmailLoading(true)

    try {
      const data = await api.post('/api/users/me/email-change', { newEmail })
      setPendingEmail(newEmail)
      setNewEmail('')
      setEmailMsg({ type: 'success', text: data.message || 'Se envió un email de verificación.' })
    } catch (err) {
      setEmailMsg({ type: 'error', text: err.message || 'Error al solicitar el cambio de email.' })
    } finally {
      setEmailLoading(false)
    }
  }

  const handleCancelEmailChange = async () => {
    try {
      await api.delete('/api/users/me/email-change')
      setPendingEmail(null)
      setEmailMsg({ type: 'success', text: 'Cambio de email cancelado.' })
    } catch (err) {
      setEmailMsg({ type: 'error', text: err.message || 'Error al cancelar.' })
    }
  }

  const handleUnlinkProvider = async (provider) => {
    setUnlinkConfirm(null)
    setConnectionMsg(null)
    setConnectionLoading(true)

    try {
      await api.delete(`/api/users/me/connections/${provider}`)
      setOauthProvider(null)
      await loadConnections()
      setConnectionMsg({ type: 'success', text: 'Cuenta desvinculada correctamente.' })
    } catch (err) {
      setConnectionMsg({ type: 'error', text: err.message || 'Error al desvincular.' })
    } finally {
      setConnectionLoading(false)
    }
  }

  const handleLinkGoogle = () => {
    // Redirect to the backend OAuth2 flow — on success the backend will link to the existing user by email
    window.location.href = `${import.meta.env.VITE_API_URL}/oauth2/authorization/google`
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordMsg(null)

    if (!isNewPasswordValid) {
      setPasswordMsg({ type: 'error', text: 'La contraseña no cumple con los requisitos de seguridad.' })
      return
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Las contraseñas no coinciden.' })
      return
    }

    setPasswordLoading(true)

    try {
      await api.put('/api/users/me/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordMsg({ type: 'success', text: 'Contraseña actualizada correctamente.' })
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Error al cambiar la contraseña.' })
    } finally {
      setPasswordLoading(false)
    }
  }

  const avatarSrc = getEntityImageSrc({
    imageUrl: profile.avatarUrl,
    imageBase64: profile.avatarBase64,
  })
  const hasAvatar = Boolean(avatarSrc)
  const avatarHelpText = hasAvatar
    ? 'Actualizá tu foto de perfil cuando quieras.'
    : 'Subí una foto de perfil para completar tu cuenta.'

  // El backend devuelve `verificationStatus` cuando existe una verificación y
  // `status` (NOT_SUBMITTED) cuando no. Normalizamos igual que en MyCampaigns.
  const verifStatus = verification?.verificationStatus ?? verification?.status ?? 'NOT_SUBMITTED'

  if (initialLoading) {
    return (
      <div className="config-page">
        <div className="config-loading">Cargando perfil...</div>
      </div>
    )
  }

  return (
    <div className="config-page">
      <div className="config-container">
        <div className="config-header">
          <div className="config-header-icon">
            <CircleUserRound size={22} aria-hidden="true" />
          </div>
          <div>
            <h1>Mi perfil</h1>
            <p>Editá tu foto, tu nombre de usuario y la información principal de tu cuenta.</p>
          </div>
        </div>

        {/* ═══════ Profile Section ═══════ */}
        <form onSubmit={handleProfileSubmit}>
          <div className="config-section">
            <h2 className="config-section-title">Edición de perfil</h2>

            {profileMsg && (
              <div className={`config-message config-message--${profileMsg.type}`}>
                {profileMsg.text}
              </div>
            )}

            <div className="config-avatar-row">
              <div className="config-avatar">
                {hasAvatar ? <img src={avatarSrc} alt="" /> : <UserIcon size={34} />}
              </div>

              <div className="config-avatar-content">
                <div className="config-avatar-copy">
                  <strong>Foto de perfil</strong>
                  <span>{avatarHelpText}</span>
                </div>

                <div className="config-avatar-actions">
                  <label className="config-avatar-btn">
                    <Upload size={14} /> {hasAvatar ? 'Cambiar foto' : 'Subir foto'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        handleAvatarPick(e.target.files)
                        e.target.value = ''
                      }}
                    />
                  </label>

                  {profile.avatarSource === 'CUSTOM' && (
                    <button type="button" className="config-avatar-link" onClick={handleAvatarRemove}>
                      <X size={14} /> Quitar foto
                    </button>
                  )}
                </div>

                <span className="config-avatar-hint">Cuadrada, hasta 10 MB y con recorte 1:1.</span>
              </div>
            </div>

            <div className="config-form-grid config-form-grid--two">
              <div className="config-field">
                <label htmlFor="userName">Nombre de usuario</label>
                <input
                  id="userName"
                  name="userName"
                  type="text"
                  value={profile.userName}
                  onChange={handleProfileChange}
                  autoComplete="username"
                />
              </div>

              <div className="config-field">
                <label htmlFor="phone">Teléfono</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  placeholder="+54 11 1234-5678"
                  autoComplete="tel"
                />
              </div>

              <div className="config-field">
                <label htmlFor="firstName">Nombre</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={profile.firstName}
                  onChange={handleProfileChange}
                  autoComplete="given-name"
                />
              </div>

              <div className="config-field">
                <label htmlFor="lastName">Apellido</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={profile.lastName}
                  onChange={handleProfileChange}
                  autoComplete="family-name"
                />
              </div>

              <div className="config-field">
                <label htmlFor="gender">Género</label>
                <select
                  id="gender"
                  name="gender"
                  value={profile.gender}
                  onChange={handleProfileChange}
                >
                  {GENDER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="config-actions">
              <Button type="submit" variant="primary" size="sm" disabled={profileLoading}>
                {profileLoading ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </form>

        {/* ═══════ Email Section ═══════ */}
        <div className="config-section">
          <h2 className="config-section-title">Email</h2>

          {emailMsg && (
            <div className={`config-message config-message--${emailMsg.type}`}>
              {emailMsg.text}
            </div>
          )}

          {pendingEmail && (
            <div className="config-pending-email">
              <span>
                <Mail size={14} style={{ verticalAlign: 'middle', marginRight: '0.375rem' }} />
                Verificación pendiente para <strong>{pendingEmail}</strong>
              </span>
              <Button variant="ghost" size="sm" onClick={handleCancelEmailChange}>
                <X size={14} /> Cancelar
              </Button>
            </div>
          )}

          <div className="config-field" style={{ marginBottom: 'var(--space-sm)' }}>
            <label>Email actual</label>
            <input type="email" value={currentEmail} disabled />
          </div>

          <form onSubmit={handleEmailChangeSubmit}>
            <div className="config-email-row" style={{ marginTop: 'var(--space-md)' }}>
              <div className="config-field">
                <label htmlFor="newEmail">Nuevo email</label>
                <input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nuevo@email.com"
                  autoComplete="email"
                  required
                />
              </div>
              <Button type="submit" variant="primary" size="sm" disabled={emailLoading} style={{ marginBottom: '2px' }}>
                {emailLoading ? 'Enviando...' : 'Cambiar email'}
              </Button>
            </div>
          </form>
        </div>

        {/* ═══════ Connections Section ═══════ */}
        <div className="config-section">
          <h2 className="config-section-title">Conexiones</h2>

          {connectionMsg && (
            <div className={`config-message config-message--${connectionMsg.type}`}>
              {connectionMsg.text}
            </div>
          )}

          {connections.map((conn) => (
            <div className="config-connection" key={conn.provider}>
              <div className="config-connection-info">
                <div className={`config-connection-icon config-connection-icon--${conn.provider}`}>
                  {conn.provider === 'google' && <GoogleIcon />}
                </div>
                <div className="config-connection-details">
                  <span className="config-connection-name">
                    {conn.provider === 'google' ? 'Google' : conn.provider}
                  </span>
                  {conn.linked ? (
                    <>
                      <span className="config-connection-status config-connection-status--linked">
                        Conectado
                      </span>
                      {conn.providerEmail && (
                        <span className="config-connection-email">{conn.providerEmail}</span>
                      )}
                    </>
                  ) : (
                    <span className="config-connection-status">No conectado</span>
                  )}
                </div>
              </div>

              {conn.linked ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUnlinkConfirm(conn.provider)}
                  disabled={connectionLoading}
                >
                  Desvincular
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleLinkGoogle}
                  disabled={connectionLoading}
                >
                  Conectar
                </Button>
              )}
            </div>
          ))}

          {connections.length === 0 && (
            <div className="config-connection">
              <div className="config-connection-info">
                <div className="config-connection-icon config-connection-icon--google">
                  <GoogleIcon />
                </div>
                <div className="config-connection-details">
                  <span className="config-connection-name">Google</span>
                  <span className="config-connection-status">No conectado</span>
                </div>
              </div>
              <Button variant="primary" size="sm" onClick={handleLinkGoogle}>
                Conectar
              </Button>
            </div>
          )}
        </div>

        {/* ═══════ Unlink Confirmation Dialog ═══════ */}
        {unlinkConfirm && (
          <div className="config-overlay" onClick={() => setUnlinkConfirm(null)}>
            <div className="config-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="config-dialog-icon">
                <AlertTriangle size={28} />
              </div>
              <h3 className="config-dialog-title">¿Desvincular cuenta?</h3>
              <p className="config-dialog-text">
                Si desvinculás tu cuenta de Google y luego iniciás sesión con Google usando este email, se creará una cuenta nueva.
              </p>
              <div className="config-dialog-actions">
                <Button variant="ghost" size="sm" onClick={() => setUnlinkConfirm(null)}>
                  Cancelar
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleUnlinkProvider(unlinkConfirm)}>
                  Desvincular
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ Creator Section ═══════ */}
        {user?.role !== 'ADMIN' && (
          <div className="config-section">
            <h2 className="config-section-title">Creador</h2>
            {user?.role === 'CREATOR' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <CheckCircle size={20} style={{ color: 'var(--color-success, #16a34a)', flexShrink: 0 }} />
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  Tu cuenta está verificada como creador. Podés publicar y gestionar campañas.
                </p>
              </div>
            ) : verifStatus === 'NOT_SUBMITTED' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    Convertite en creador para publicar y gestionar tus propias campañas de crowdfunding.
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={() => navigate('/become-creator')}>
                  <Rocket size={14} style={{ marginRight: '0.375rem' }} />
                  Hacete Creador
                </Button>
              </div>
            ) : verifStatus === 'PENDING' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <Info size={20} style={{ color: '#92400e', flexShrink: 0 }} />
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  Tu solicitud de verificación está siendo evaluada por nuestro equipo. Te notificaremos cuando haya una respuesta.
                </p>
              </div>
            ) : verifStatus === 'REJECTED' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <AlertTriangle size={20} style={{ color: '#991b1b', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    Tu verificación fue rechazada. {verification?.rejectionReason || 'Podés volver a intentarlo.'}
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={() => navigate('/become-creator')}>
                  <Rocket size={14} style={{ marginRight: '0.375rem' }} />
                  Reintentar
                </Button>
              </div>
            ) : null}
          </div>
        )}

        {/* ═══════ Password Section ═══════ */}
        <form onSubmit={handlePasswordSubmit}>
          <div className="config-section">
            <h2 className="config-section-title">Cambiar contraseña</h2>

            {passwordMsg && (
              <div className={`config-message config-message--${passwordMsg.type}`}>
                {passwordMsg.text}
              </div>
            )}

            <div className="config-form-grid">
              <div className="config-field">
                <label htmlFor="currentPassword">Contraseña actual</label>
                <div className="config-password-wrapper">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPwd ? 'text' : 'password'}
                    value={passwords.currentPassword}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="config-password-toggle"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    tabIndex={-1}
                    aria-label={showCurrentPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="config-field">
                <label htmlFor="newPassword">Nueva contraseña</label>
                <div className="config-password-wrapper">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPwd ? 'text' : 'password'}
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="config-password-toggle"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    tabIndex={-1}
                    aria-label={showNewPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordRequirements password={passwords.newPassword} />
              </div>

              <div className="config-field">
                <label htmlFor="confirmPassword">Confirmar nueva contraseña</label>
                <div className="config-password-wrapper">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="config-password-toggle"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    tabIndex={-1}
                    aria-label={showConfirmPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                  <span className="config-field-hint config-field-hint--error">
                    Las contraseñas no coinciden
                  </span>
                )}
              </div>
            </div>

            <div className="config-actions">
              <Button type="submit" variant="primary" size="sm" disabled={passwordLoading || !isNewPasswordValid}>
                {passwordLoading ? 'Actualizando...' : 'Cambiar contraseña'}
              </Button>
            </div>
          </div>
        </form>

        {avatarCropSrc && (
          <ImageCropModal
            src={avatarCropSrc}
            aspect={1}
            fileName="avatar.jpg"
            onCancel={() => setAvatarCropSrc(null)}
            onConfirm={async ({ file }) => {
              const avatarBase64 = await fileToBase64(file)
              setProfile(prev => ({
                ...prev,
                avatarBase64,
                avatarUrl: '',
                removeAvatar: false,
                avatarSource: 'CUSTOM',
              }))
              setAvatarCropSrc(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default UserConfig
