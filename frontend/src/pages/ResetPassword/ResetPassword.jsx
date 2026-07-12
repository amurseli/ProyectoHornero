import { useState, useEffect } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "../../components/ui"
import PasswordRequirements from "../../components/PasswordRequirements/PasswordRequirements"
import { evaluatePassword, PASSWORD_MAX_LENGTH } from "../../utils/passwordPolicy"
import api from "../../utils/api/api"
import "../auth.css"

function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [invalidToken, setInvalidToken] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const isPasswordValid = evaluatePassword(newPassword).allValid

  useEffect(() => {
    // Check if token exists in URL
    if (!token) {
      setInvalidToken(true)
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    setError("")

    // Validate password against the security policy
    if (!isPasswordValid) {
      setError("La contraseña no cumple con los requisitos de seguridad.")
      return
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setLoading(true)

    try {
      await api.post("/api/users/reset-password", {
        token,
        newPassword
      })

      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login")
      }, 3000)
    } catch (err) {
      console.error("Error resetting password:", err)
      setError(err.message || "Error al restablecer la contraseña. El token puede estar expirado o ser inválido.")
    } finally {
      setLoading(false)
    }
  }

  if (invalidToken) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <section className="auth-card">
            <div className="auth-error-state">
              <div className="auth-error-icon">✕</div>
              <h3 className="auth-error-title">Enlace inválido</h3>
              <p className="auth-error-text">
                El enlace de recuperación no es válido o ha expirado.
              </p>
              <Link to="/forgot-password">
                <Button className="auth-submit">Solicitar nuevo enlace</Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <section className="auth-card">
          <header className="auth-header">
            <Link to="/" className="auth-logo">PROYECTO HORNERO</Link>
            <h1 className="auth-title">Restablecer contraseña</h1>
            <p className="auth-subtitle">
              Ingresá tu nueva contraseña
            </p>
          </header>

          {!success ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-form-group">
                <label htmlFor="newPassword" className="auth-label">Nueva contraseña</label>
                <div className="auth-password-wrapper">
                  <input
                    id="newPassword"
                    className="auth-input"
                    type={showPassword ? "text" : "password"}
                    required
                    maxLength={PASSWORD_MAX_LENGTH}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Creá una contraseña segura"
                    disabled={loading}
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
                <PasswordRequirements password={newPassword} />
              </div>

              <div className="auth-form-group">
                <label htmlFor="confirmPassword" className="auth-label">Confirmar contraseña</label>
                <div className="auth-password-wrapper">
                  <input
                    id="confirmPassword"
                    className="auth-input"
                    type={showConfirm ? "text" : "password"}
                    required
                    maxLength={PASSWORD_MAX_LENGTH}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetí tu contraseña"
                    disabled={loading}
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
                {confirmPassword && newPassword !== confirmPassword && (
                  <span className="auth-field-hint auth-field-hint--error">
                    Las contraseñas no coinciden
                  </span>
                )}
              </div>

              {error && <div className="auth-error" role="alert">{error}</div>}

              <Button type="submit" disabled={loading || !isPasswordValid} className="auth-submit">
                {loading ? "Guardando..." : "Restablecer contraseña"}
              </Button>

              <footer className="auth-footer">
                <p className="auth-footer-text">
                  <Link to="/login" className="auth-footer-link">← Volver a iniciar sesión</Link>
                </p>
              </footer>
            </form>
          ) : (
            <div className="auth-success">
              <div className="auth-success-icon">✓</div>
              <h3 className="auth-success-title">¡Contraseña actualizada!</h3>
              <p className="auth-success-text">
                Tu contraseña ha sido restablecida exitosamente.
              </p>
              <p className="auth-success-note">
                Redirigiendo al inicio de sesión...
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default ResetPassword
