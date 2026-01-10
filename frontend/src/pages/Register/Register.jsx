import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DefaultButton from '$components/buttons/DefaultButton'
import api from '$utils/api/api'
import { useUser } from '$lib/store/useUser'
import './Register.css'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useUser()
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    
    setLoading(true)
    try {
      const userData = {
        userName: username,
        firstName: firstName,
        email: email,
        password: password,
        enabled: true,
        remember: true // Always remember on registration
      }
      
      const response = await api.post('/api/users/register', userData)
      console.log('Usuario registrado:', response)
      
      // Save user data to global store
      login(response)
      
      // Redirigir al home después del registro exitoso
      navigate('/')
    } catch (err) {
      console.error('Error al registrar:', err)
      setError(err.message || 'Error al crear la cuenta. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <section className="content-card auth-card" aria-labelledby="register-title">
          <header className="card-header">
            <h2 id="register-title" className="card-title">Crear cuenta</h2>
          </header>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-label">Nombre de usuario
              <input
                className="form-input"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu nombre de usuario"
              />
            </label>

            <label className="form-label">Nombre
              <input
                className="form-input"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
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
              <DefaultButton type="submit" content={loading ? "Creando cuenta..." : "Crear cuenta"} disabled={loading} />
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}