import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "../../components/ui"
import PasswordRequirements from "../../components/PasswordRequirements/PasswordRequirements"
import { evaluatePassword, PASSWORD_MAX_LENGTH } from "../../utils/passwordPolicy"
import api from "../../utils/api/api"
import { useUser } from "../../store/useUser"
import { initiateGoogleLogin } from "../../utils/auth/oauth"
import { usePostLoginNavigate } from "../../utils/auth/usePostLoginNavigate"
import "../auth.css"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Google SVG icon
const GoogleIcon = () => (
  <svg className="auth-oauth-icon" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

function Register() {
  const navigate = useNavigate()
  const { user } = useUser()
  const goPostLogin = usePostLoginNavigate()

  const [formData, setFormData] = useState({
    userName: "",
    firstName: "",
    email: "",
    password: "",
    confirm: ""
  })
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const isPasswordValid = evaluatePassword(formData.password).allValid

  // Redirect if already authenticated
  useEffect(() => {
    if (user) goPostLogin()
  }, [user, goPostLogin])

  // Validación por campo (los requisitos de contraseña se muestran aparte).
  const validateField = (name, value) => {
    const v = (value ?? "").trim()
    switch (name) {
      case "userName": return v ? "" : "El nombre de usuario es obligatorio"
      case "firstName": return v ? "" : "El nombre es obligatorio"
      case "email":
        if (!v) return "El correo electrónico es obligatorio"
        return EMAIL_RE.test(v) ? "" : "Ingresá un correo electrónico válido"
      default: return ""
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    // Si el campo ya mostraba error, lo revalidamos al escribir para limpiarlo al corregir.
    setFieldErrors(prev => (prev[name] ? { ...prev, [name]: validateField(name, value) } : prev))
  }

  // Valida el campo al perder el foco.
  const handleBlur = (e) => {
    const { name, value } = e.target
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!isPasswordValid) {
      setError("La contraseña no cumple con los requisitos de seguridad.")
      return
    }

    if (formData.password !== formData.confirm) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)
    try {
      const userData = {
        userName: formData.userName,
        firstName: formData.firstName,
        email: formData.email,
        password: formData.password,
        enabled: true
      }

      await api.post('/api/users/register', userData)
      
      // Redirect to email verification page instead of auto-login
      navigate("/email-sent", { state: { email: formData.email } })
    } catch (err) {
      console.error("Error al registrar:", err)
      setError(err.message || "Error al crear la cuenta. Intentá de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = () => {
    setOauthLoading(true)
    setError("")
    initiateGoogleLogin()
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <section className="auth-card">
          <header className="auth-header">
            <Link to="/" className="auth-logo">PROYECTO HORNERO</Link>
            <h1 className="auth-title">Creá tu cuenta</h1>
            <p className="auth-subtitle">Unite a la comunidad de creadores</p>
          </header>

          {/* OAuth Buttons */}
          <button 
            type="button" 
            className="auth-oauth-button"
            onClick={handleGoogleSignup}
            disabled={oauthLoading}
          >
            <GoogleIcon />
            {oauthLoading ? "Redirigiendo..." : "Registrarse con Google"}
          </button>

          <div className="auth-divider">
            <span className="auth-divider-text">o</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-row">
              <div className="auth-form-group">
                <label htmlFor="userName" className="auth-label">Usuario</label>
                <input
                  id="userName"
                  name="userName"
                  className="auth-input"
                  type="text"
                  required
                  maxLength={50}
                  value={formData.userName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="tu_usuario"
                  autoComplete="username"
                />
                {fieldErrors.userName && (
                  <span className="auth-field-hint auth-field-hint--error">{fieldErrors.userName}</span>
                )}
              </div>

              <div className="auth-form-group">
                <label htmlFor="firstName" className="auth-label">Nombre</label>
                <input
                  id="firstName"
                  name="firstName"
                  className="auth-input"
                  type="text"
                  required
                  maxLength={100}
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Tu nombre"
                  autoComplete="given-name"
                />
                {fieldErrors.firstName && (
                  <span className="auth-field-hint auth-field-hint--error">{fieldErrors.firstName}</span>
                )}
              </div>
            </div>

            <div className="auth-form-group">
              <label htmlFor="email" className="auth-label">Correo electrónico</label>
              <input
                id="email"
                name="email"
                className="auth-input"
                type="email"
                required
                maxLength={255}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="tu@email.com"
                autoComplete="email"
              />
              {fieldErrors.email && (
                <span className="auth-field-hint auth-field-hint--error">{fieldErrors.email}</span>
              )}
            </div>

            <div className="auth-form-group">
              <label htmlFor="password" className="auth-label">Contraseña</label>
              <div className="auth-password-wrapper">
                <input
                  id="password"
                  name="password"
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  required
                  maxLength={PASSWORD_MAX_LENGTH}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Creá una contraseña segura"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordRequirements password={formData.password} />
            </div>

            <div className="auth-form-group">
              <label htmlFor="confirm" className="auth-label">Confirmar contraseña</label>
              <div className="auth-password-wrapper">
                <input
                  id="confirm"
                  name="confirm"
                  className="auth-input"
                  type={showConfirm ? "text" : "password"}
                  required
                  maxLength={PASSWORD_MAX_LENGTH}
                  value={formData.confirm}
                  onChange={handleChange}
                  placeholder="Repetí tu contraseña"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formData.confirm && formData.password !== formData.confirm && (
                <span className="auth-field-hint auth-field-hint--error">
                  Las contraseñas no coinciden
                </span>
              )}
            </div>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <Button type="submit" disabled={loading || !isPasswordValid} className="auth-submit">
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

          <footer className="auth-footer">
            <p className="auth-footer-text">
              ¿Ya tenés cuenta?{" "}
              <Link to="/login" className="auth-footer-link">Iniciá sesión</Link>
            </p>
          </footer>
        </section>
      </div>
    </div>
  )
}

export default Register