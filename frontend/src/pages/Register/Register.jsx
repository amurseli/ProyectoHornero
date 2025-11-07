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
    <>
      <div className="home-background" />
      <div className="home-overlay" />

      <main className="register-page">
        <section className="register-card" aria-labelledby="register-title">
          <h2 id="register-title">Crear cuenta</h2>
          <form className="register-form" onSubmit={handleSubmit}>
            <label className="label">Nombre completo
              <input
                className="input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
              />
            </label>

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

            <label className="label">Confirmar contraseña
              <input
                className="input"
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
      </main>
    </>
  )
}