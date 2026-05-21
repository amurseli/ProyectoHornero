import { Navigate } from 'react-router-dom'
import { useUser } from '../store/useUser'

/**
 * CreatorRoute - Guards routes that require at least CREATOR role.
 * Users with role "USER" are redirected to /become-creator.
 * Unauthenticated users are redirected to /login.
 */
export function CreatorRoute({ children }) {
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

  if (user.role === 'USER') {
    return <Navigate to="/for-creators" replace />
  }

  return children
}

export default CreatorRoute
