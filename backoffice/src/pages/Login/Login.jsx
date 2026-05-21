import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Button } from '../../components'
import { useUser } from '../../store/useUser'
import api from '../../utils/api'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const { login, user } = useUser()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already authenticated as admin -> go straight to the panel
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/api/users/login', { email, password })

      if (response.role !== 'ADMIN') {
        setError('Esta cuenta no tiene permisos de administrador.')
        // Drop the session created by the login request.
        api.post('/api/users/logout').catch(() => {})
        return
      }

      login(response)
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Error al iniciar sesion:', err)
      setError(err.message || 'Credenciales inválidas. Verificá tu email y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <section className="login-card">
        <header className="login-header">
          <div className="login-badge">
            <ShieldCheck size={28} />
          </div>
          <p className="login-brand">Proyecto Hornero</p>
          <h1 className="login-title">Backoffice</h1>
          <p className="login-subtitle">Acceso exclusivo para administradores</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email" className="login-label">Correo electrónico</label>
            <input
              id="email"
              className="login-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@email.com"
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-label">Contraseña</label>
            <input
              id="password"
              className="login-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="login-error" role="alert">{error}</div>}

          <Button type="submit" disabled={loading} className="login-submit">
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </Button>
        </form>
      </section>
    </div>
  )
}

export default Login
