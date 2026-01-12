import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleOAuth2Redirect } from '$utils/auth/oauth'
import { useUser } from '$lib/store/useUser'

function OAuth2Redirect() {
  const navigate = useNavigate()
  const { login } = useUser()
  const [status, setStatus] = useState('processing')

  useEffect(() => {
    const processOAuth2Callback = async () => {
      try {
        const result = await handleOAuth2Redirect()
        
        if (result && result.success) {
          // User data is saved, update global store
          login(result.user)
          setStatus('success')
          
          // Redirect to home page after a brief moment
          setTimeout(() => {
            navigate('/')
          }, 1000)
        } else if (result && result.error) {
          setStatus('error')
          console.error('OAuth2 error:', result.error)
          
          // Redirect to login after showing error
          setTimeout(() => {
            navigate('/login?error=' + encodeURIComponent(result.error))
          }, 2000)
        } else {
          // No OAuth callback params, redirect to login
          navigate('/login')
        }
      } catch (error) {
        console.error('Error processing OAuth2 callback:', error)
        setStatus('error')
        
        setTimeout(() => {
          navigate('/login?error=authentication_failed')
        }, 2000)
      }
    }

    processOAuth2Callback()
  }, [navigate, login])

  return (
    <div className="page-wrapper">
      <div className="page-container" style={{ textAlign: 'center', padding: '2rem' }}>
        {status === 'processing' && (
          <div>
            <div className="spinner" style={{
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #D94F30',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <h2>Procesando autenticación...</h2>
            <p>Por favor espera un momento.</p>
          </div>
        )}
        
        {status === 'success' && (
          <div>
            <div style={{ fontSize: '3rem', color: '#10b981' }}>✓</div>
            <h2>¡Inicio de sesión exitoso!</h2>
            <p>Redirigiendo...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div>
            <div style={{ fontSize: '3rem', color: '#ef4444' }}>✗</div>
            <h2>Error al iniciar sesión</h2>
            <p>Redirigiendo a la página de inicio de sesión...</p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default OAuth2Redirect
