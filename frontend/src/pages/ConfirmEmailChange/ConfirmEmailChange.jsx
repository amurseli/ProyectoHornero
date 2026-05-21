import { useState, useEffect, useRef } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { Button } from "../../components/ui"
import api from "../../utils/api/api"
import { AnimatedCheck } from "../../components/ui"
import "../auth.css"

function ConfirmEmailChange() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [error, setError] = useState("")

  const hasConfirmed = useRef(false)

  useEffect(() => {
    if (!token) {
      setError("Token inválido")
      setLoading(false)
      return
    }

    if (hasConfirmed.current) return
    hasConfirmed.current = true

    const confirm = async () => {
      setLoading(true)
      try {
        const response = await api.post(
          `/api/users/me/email-change/confirm?token=${encodeURIComponent(token)}`,
          null
        )
        setSuccess(true)
        setNewEmail(response.email || "")
      } catch (err) {
        setError(err.message || "Error al confirmar el cambio de email.")
      } finally {
        setLoading(false)
      }
    }

    confirm()
  }, [token])

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <section className="auth-card">
            <div className="auth-loading">
              <div className="loading-spinner"></div>
              <h3 className="auth-loading-title">Confirmando tu nuevo email...</h3>
              <p className="auth-loading-text">Por favor esperá un momento.</p>
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <section className="auth-card">
            <div className="auth-error-state">
              <div className="auth-error-icon">✕</div>
              <h3 className="auth-error-title">Error al cambiar email</h3>
              <p className="auth-error-text">{error}</p>
              <p className="auth-error-note">
                El enlace puede haber expirado. Los enlaces de confirmación son válidos por 1 hora.
              </p>
              <Link to="/configuracion">
                <Button className="auth-submit">Volver a configuración</Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <section className="auth-card">
            <div className="auth-success">
              <AnimatedCheck />
              <h3 className="auth-success-title">¡Email actualizado!</h3>
              <p className="auth-success-text">
                Tu email ha sido cambiado a <strong>{newEmail}</strong> exitosamente.
              </p>
              <Link to="/configuracion">
                <Button className="auth-submit">Ir a configuración</Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return null
}

export default ConfirmEmailChange
