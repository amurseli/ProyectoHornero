import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import DefaultButton from '$components/buttons/DefaultButton'
import api from '$utils/api/api'
import './ResetPassword.css'

function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [invalidToken, setInvalidToken] = useState(false)

  useEffect(() => {
    // Check if token exists in URL
    if (!token) {
      setInvalidToken(true)
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    setError('')
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    
    // Validate password length
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await api.post('/api/users/reset-password', {
        token,
        newPassword
      })
      
      console.log('Password reset successful:', response)
      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      console.error('Error resetting password:', err)
      setError(err.message || 'Error al restablecer la contraseña. El token puede estar expirado o ser inválido.')
    } finally {
      setLoading(false)
    }
  }

  if (invalidToken) {
    return (
      <div className="page-wrapper">
        <div className="page-container">
          <section className="content-card auth-card">
            <div className="error-message">
              <div className="error-icon">✕</div>
              <h3>Enlace inválido</h3>
              <p>
                El enlace de recuperación no es válido o ha expirado.
              </p>
              <div className="form-actions">
                <Link to="/forgot-password">
                  <DefaultButton content="Solicitar nuevo enlace" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <section className="content-card auth-card" aria-labelledby="reset-password-title">
          <header className="card-header">
            <h2 id="reset-password-title" className="card-title">Restablecer contraseña</h2>
            <p className="card-subtitle">
              Ingresa tu nueva contraseña
            </p>
          </header>

          {!success ? (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="form-label">Nueva contraseña
                <input
                  className="form-input"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  disabled={loading}
                  minLength={8}
                />
              </label>

              <label className="form-label">Confirmar contraseña
                <input
                  className="form-input"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  disabled={loading}
                  minLength={8}
                />
              </label>

              {error && <div className="form-error" role="alert">{error}</div>}

              <div className="form-actions">
                <DefaultButton 
                  type="submit" 
                  content={loading ? "Guardando..." : "Restablecer contraseña"} 
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
              <h3>¡Contraseña actualizada!</h3>
              <p>
                Tu contraseña ha sido restablecida exitosamente.
              </p>
              <p className="success-note">
                Redirigiendo al inicio de sesión...
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default ResetPassword
