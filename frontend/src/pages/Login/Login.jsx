import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DefaultButton from '$components/buttons/DefaultButton'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: replace with real auth call
    console.log('login', { email, password, remember })
    // naive redirect to home
    navigate('/')
  }

  return (
    <>
      <div className="home-background" />
      <div className="home-overlay" />

      <main className="login-page">
        <section className="login-card" aria-labelledby="login-title">
          <h2 id="login-title">Iniciar sesión</h2>
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="label">Correo electrónico
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
              />
            </label>

            <label className="label">Contraseña
              <input
                className="input"
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

            <div className="login-actions">
              <DefaultButton type="submit" content="Entrar" />
            </div>
          </form>
        </section>
      </main>
    </>
  )
}

export default Login
