import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "../../components/ui"
import api from "../../utils/api/api"
import { saveAuth } from "../../utils/auth/auth"
import "../auth.css"

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await api.post('/api/users/login', { email, password })
      saveAuth(response, remember)
      window.dispatchEvent(new Event('storage'))
      navigate("/")
    } catch (err) {
      console.error("Error al iniciar sesion:", err)
      setError("Credenciales inválidas. Verificá tu email y contraseña.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <section className="auth-card">
          <header className="auth-header">
            <Link to="/" className="auth-logo">PROYECTO HORNERO</Link>
            <h1 className="auth-title">Bienvenido de nuevo</h1>
            <p className="auth-subtitle">Ingresá a tu cuenta para continuar</p>
          </header>

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
                autoComplete="email"
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="password" className="auth-label">Contraseña</label>
              <input
                id="password"
                className="auth-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div className="auth-options">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="auth-checkbox"
                />
                Recordarme
              </label>
              <Link to="/forgot-password" className="auth-link">¿Olvidaste tu contraseña?</Link>
            </div>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <Button type="submit" disabled={loading} className="auth-submit">
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </Button>
          </form>

          <footer className="auth-footer">
            <p className="auth-footer-text">
              ¿No tenés cuenta?{" "}
              <Link to="/register" className="auth-footer-link">Registrate gratis</Link>
            </p>
          </footer>
        </section>
      </div>
    </div>
  )
}

export default Login