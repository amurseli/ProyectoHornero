import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import DefaultButton from '$components/buttons/DefaultButton'
import api from '$utils/api/api'
import './VerifyEmail.css'

function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [verifiedEmail, setVerifiedEmail] = useState('')
  
  // Use ref to prevent double API calls
  const hasVerified = useRef(false)

  useEffect(() => {
    // Check if token exists in URL
    if (!token) {
      setError('Token inválido')
      setLoading(false)
      return
    }

    // Prevent duplicate calls (React StrictMode or re-renders)
    if (hasVerified.current) {
      return
    }

    // Mark as verified to prevent duplicate calls
    hasVerified.current = true

    // Automatically verify email when component mounts
    const verifyEmail = async () => {
      setLoading(true)
      setError('')
      
      try {
        const response = await api.get(`/api/users/verify-email?token=${token}`)
        
        console.log('Email verified successfully:', response)
        setSuccess(true)
        setVerifiedEmail(response.email || '')
        setLoading(false)
      } catch (err) {
        console.error('Error verifying email:', err)
        setError(err.message || 'Error al verificar el email. El token puede estar expirado o ser inválido.')
        setLoading(false)
      }
    }

    verifyEmail()
  }, [token, navigate])

  // Loading state
  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="page-container">
          <section className="content-card auth-card">
            <div className="loading-message">
              <div className="loading-spinner"></div>
              <h3>Verificando tu email...</h3>
              <p>Por favor espera un momento.</p>
            </div>
          </section>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="page-wrapper">
        <div className="page-container">
          <section className="content-card auth-card">
            <div className="error-message">
              <div className="error-icon">✕</div>
              <h3>Error al verificar email</h3>
              <p>{error}</p>
              <p className="error-note">
                El enlace puede haber expirado. Los enlaces de verificación son válidos por 24 horas.
              </p>
              <div className="form-actions">
                <Link to="/login">
                  <DefaultButton content="Ir a inicio de sesión" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="page-wrapper">
        <div className="page-container">
          <section className="content-card auth-card">
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h3>¡Email verificado!</h3>
              <p>
                Tu dirección de email <strong>{verifiedEmail}</strong> ha sido verificada exitosamente.
              </p>
              <p className="success-note">
                Ahora puedes iniciar sesión con tu cuenta.
              </p>
              <div className="form-actions">
                <Link to="/login">
                  <DefaultButton content="Ir a inicio de sesión" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return null
}

export default VerifyEmail
