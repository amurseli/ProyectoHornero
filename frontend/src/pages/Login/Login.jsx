'use client';

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "../../components/ui"
import "./Login.css"

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
      // TODO: Replace with actual API call
      // const response = await api.post('/api/users/login', { email, password })
      // saveAuth(response, remember)
      // window.dispatchEvent(new Event('storage'))
      
      // Simulate login for now
      await new Promise((resolve) => setTimeout(resolve, 1000))
      navigate("/")
    } catch (err) {
      console.error("Error al iniciar sesion:", err)
      setError("Credenciales invalidas. Por favor verifica tu email y contrasena.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <section className="login-card" aria-labelledby="login-title">
          <header className="login-header">
            <h1 id="login-title" className="login-title">Iniciar sesion</h1>
            <p className="login-subtitle">Ingresa a tu cuenta para continuar</p>
          </header>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Correo electronico
              </label>
              <input
                id="email"
                className="form-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Contrasena
              </label>
              <input
                id="password"
                className="form-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                autoComplete="current-password"
              />
            </div>

            <div className="login-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">Recuerdame</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Olvidaste tu contrasena?
              </Link>
            </div>

            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="login-submit-btn">
              {loading ? "Iniciando..." : "Iniciar sesion"}
            </Button>
          </form>

          <footer className="login-footer">
            <p className="login-footer-text">
              No tienes una cuenta?{" "}
              <Link to="/register" className="register-link">
                Registrate
              </Link>
            </p>
          </footer>
        </section>
      </div>
    </div>
  )
}

export default Login
