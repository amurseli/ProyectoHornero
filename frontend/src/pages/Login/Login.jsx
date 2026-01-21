import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '$components/ui'
import api from '$utils/api/api'
import { saveAuth } from '$utils/auth/auth'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const response = await api.post('/api/users/login', { email, password })
      saveAuth(response, remember)
      window.dispatchEvent(new Event('storage'))
      navigate('/')
    } catch (err) {
      console.error('Error al iniciar sesión:', err)
      setError('Credenciales inválidas. Por favor verifica tu email y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <section className="content-card auth-card" aria-labelledby="login-title">
          <header className="card-header">
            <h2 id="login-title" className="card-title">Iniciar sesión</h2>
          </header>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-label">Correo electrónico
              <input
                className="form-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
              />
            </label>

            <label className="form-label">Contraseña
              <input
                className="form-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            <div className="login-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Recuérdame
              </label>
              <a className="forgot-link" href="#">¿Olvidaste tu contraseña?</a>
            </div>

            {error && <div className="form-error" role="alert">{error}</div>}

            <div className="login-actions">
              <Button type="submit" disabled={loading}>
                {loading ? "Iniciando..." : "Entrar"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

export default Login