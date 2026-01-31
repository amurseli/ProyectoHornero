import { useState, useEffect, useRef } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { Button } from "../../components/ui"
import api from "../../utils/api/api"
import "../auth.css"

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [verifiedEmail, setVerifiedEmail] = useState("")

  // Use ref to prevent double API calls
  const hasVerified = useRef(false)

  useEffect(() => {
    // Check if token exists in URL
    if (!token) {
      setError("Token inválido")
      setLoading(false)
      return
    }

    // Prevent duplicate calls (React StrictMode or re-renders)
    if (hasVerified.current) {
      return
    }

    // Mark as verified to prevent duplicate calls
    hasVerified.current = true

    // Automatically verify email when component mounts
    const verifyEmail = async () => {
      setLoading(true)
      setError("")

      try {
        const response = await api.get(`/api/users/verify-email?token=${token}`)

        console.log("Email verified successfully:", response)
        setSuccess(true)
        setVerifiedEmail(response.email || "")
        setLoading(false)
      } catch (err) {
        console.error("Error verifying email:", err)
        setError(err.message || "Error al verificar el email. El token puede estar expirado o ser inválido.")
        setLoading(false)
      }
    }

    verifyEmail()
  }, [token])

  // Loading state
  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <section className="auth-card">
            <div className="auth-loading">
              <div className="loading-spinner"></div>
              <h3 className="auth-loading-title">Verificando tu email...</h3>
              <p className="auth-loading-text">Por favor esperá un momento.</p>
            </div>
          </section>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <section className="auth-card">
            <div className="auth-error-state">
              <div className="auth-error-icon">✕</div>
              <h3 className="auth-error-title">Error al verificar email</h3>
              <p className="auth-error-text">{error}</p>
              <p className="auth-error-note">
                El enlace puede haber expirado. Los enlaces de verificación son válidos por 24 horas.
              </p>
              <Link to="/login">
                <Button className="auth-submit">Ir a inicio de sesión</Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <section className="auth-card">
            <div className="auth-success">
              <div className="auth-success-icon">✓</div>
              <h3 className="auth-success-title">¡Email verificado!</h3>
              <p className="auth-success-text">
                Tu dirección de email <strong>{verifiedEmail}</strong> ha sido verificada exitosamente.
              </p>
              <p className="auth-success-note">
                Ahora podés iniciar sesión con tu cuenta.
              </p>
              <Link to="/login">
                <Button className="auth-submit">Ir a inicio de sesión</Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return null
}

export default VerifyEmail
