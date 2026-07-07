import { useState, useEffect } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "../../components/ui"
import { useUser } from "../../store/useUser"
import { initiateGoogleLogin } from "../../utils/auth/oauth"
import { consumePostLoginRedirect } from "../../utils/auth/postLoginRedirect"
import api from "../../utils/api/api"
import "../auth.css"

// Google SVG icon
const GoogleIcon = () => (
  <svg className="auth-oauth-icon" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, user } = useUser()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate(consumePostLoginRedirect() || "/", { replace: true })
    }
  }, [user, navigate])

  // Check for OAuth errors in URL
  useEffect(() => {
    const oauthError = searchParams.get("error")
    if (oauthError) {
      setError(getOAuthErrorMessage(oauthError))
    }
  }, [searchParams])

  const getOAuthErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "authentication_failed":
        return "Error al autenticar con Google. Intentá de nuevo."
      case "email_already_exists":
        return "Este email ya está registrado con otro método de acceso."
      default:
        return "Ocurrió un error durante la autenticación."
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await api.post('/api/users/login', {
        email,
        password,
        remember
      })

      // Set user data in context
      login(response)

      navigate(consumePostLoginRedirect() || "/", { replace: true })
    } catch (err) {
      console.error("Error al iniciar sesion:", err)
      setError(err.message || "Credenciales inválidas. Verificá tu email y contraseña.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
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
            <h1 className="auth-title">Bienvenido de nuevo</h1>
            <p className="auth-subtitle">Ingresá a tu cuenta para continuar</p>
          </header>

          {/* OAuth Buttons */}
          <button 
            type="button" 
            className="auth-oauth-button"
            onClick={handleGoogleLogin}
            disabled={oauthLoading}
          >
            <GoogleIcon />
            {oauthLoading ? "Redirigiendo..." : "Continuar con Google"}
          </button>

          <div className="auth-divider">
            <span className="auth-divider-text">o</span>
          </div>

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
              <div className="auth-password-wrapper">
                <input
                  id="password"
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
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