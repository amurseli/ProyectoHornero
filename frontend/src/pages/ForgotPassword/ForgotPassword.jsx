import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "../../components/ui"
import api from "../../utils/api/api"
import "../auth.css"

function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      await api.post("/api/users/forgot-password", { email })
      
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        setSuccess(true)
        setEmail("")
        setLoading(false)
      }, 100)
    } catch (err) {
      console.error("Error requesting password reset:", err)
      // Even on error, we show success message for security reasons
      setTimeout(() => {
        setSuccess(true)
        setLoading(false)
      }, 100)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <section className="auth-card">
          <header className="auth-header">
            <Link to="/" className="auth-logo">PROYECTO HORNERO</Link>
            <h1 className="auth-title">¿Olvidaste tu contraseña?</h1>
            <p className="auth-subtitle">
              Ingresá tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </header>

          {!success ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-form-group">
                <label htmlFor="email" className="auth-label">Correo electrónico</label>
                <input
                  id="email"
                  className="auth-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              {error && <div className="auth-error" role="alert">{error}</div>}

              <Button type="submit" disabled={loading} className="auth-submit">
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
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
              <h3 className="auth-success-title">Revisá tu correo</h3>
              <p className="auth-success-text">
                Si el correo electrónico existe en nuestro sistema, recibirás un mensaje con instrucciones
                para restablecer tu contraseña en los próximos minutos.
              </p>
              <p className="auth-success-note">
                No olvides revisar tu carpeta de spam o correo no deseado.
              </p>
              <Link to="/login">
                <Button className="auth-submit">Volver a iniciar sesión</Button>
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default ForgotPassword
