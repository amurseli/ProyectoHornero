import { Navigate } from 'react-router-dom'
import { useUser } from '../store/useUser'

/**
 * ProtectedRoute - Simple authentication guard
 * Just checks if user exists in memory (AuthVerifier handles JWT verification)
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useUser()

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
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
