import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DefaultButton from '$components/buttons/DefaultButton'
import './Register.css'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    // TODO: call API to register
    console.log('register', { name, email, password })
    navigate('/')
  }

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <section className="content-card auth-card" aria-labelledby="register-title">
          <header className="card-header">
            <h2 id="register-title" className="card-title">Crear cuenta</h2>
          </header>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-label">Nombre completo
              <input
                className="form-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
              />
            </label>

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

            <label className="form-label">Confirmar contraseña
              <input
                className="form-input"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            {error && <div className="form-error" role="alert">{error}</div>}

            <div className="register-actions">
              <DefaultButton type="submit" content="Crear cuenta" />
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}