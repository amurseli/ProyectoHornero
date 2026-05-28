import { Navigate, useLocation } from 'react-router-dom'
import { useUser } from '../store/useUser'
import { savePostLoginRedirect } from '../utils/auth/postLoginRedirect'

/**
 * ProtectedRoute - Simple authentication guard
 * Just checks if user exists in memory (AuthVerifier handles JWT verification)
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useUser()
  const location = useLocation()

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // Remember where the user was trying to go so login can return them here.
    savePostLoginRedirect(`${location.pathname}${location.search || ''}`)
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
