import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import DefaultButton from '$components/buttons/DefaultButton'
import api from '$utils/api/api'
import './ForgotPassword.css'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    setError('')
    setSuccess(false)
    setLoading(true)
    
    try {
      const response = await api.post('/api/users/forgot-password', { email })
      console.log('Password reset request successful:', response)
      
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        setSuccess(true)
        setEmail('') // Clear form
        setLoading(false)
      }, 100)
    } catch (err) {
      console.error('Error requesting password reset:', err)
      // Even on error, we show success message for security reasons
      setTimeout(() => {
        setSuccess(true)
        setLoading(false)
      }, 100)
    }
  }

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <section className="content-card auth-card" aria-labelledby="forgot-password-title">
          <header className="card-header">
            <h2 id="forgot-password-title" className="card-title">¿Olvidaste tu contraseña?</h2>
            <p className="card-subtitle">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </header>

          {!success ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="form-label">Correo electrónico
                <input
                  className="form-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  disabled={loading}
                />
              </label>

              {error && <div className="form-error" role="alert">{error}</div>}

              <div className="form-actions">
                <DefaultButton 
                  type="submit" 
                  content={loading ? "Enviando..." : "Enviar enlace de recuperación"} 
                  disabled={loading} 
                />
              </div>

              <div className="back-to-login">
                <Link to="/login" className="back-link">
                  ← Volver a iniciar sesión
                </Link>
              </div>
            </form>
          ) : (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h3>Revisa tu correo</h3>
              <p>
                Si el correo electrónico existe en nuestro sistema, recibirás un mensaje con instrucciones 
                para restablecer tu contraseña en los próximos minutos.
              </p>
              <p className="success-note">
                No olvides revisar tu carpeta de spam o correo no deseado.
              </p>
              <div className="form-actions">
                <Link to="/login">
                  <DefaultButton content="Volver a iniciar sesión" />
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default ForgotPassword
