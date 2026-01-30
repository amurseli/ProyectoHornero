import { Navigate } from 'react-router-dom'
import { useUser } from '$lib/store/useUser'

/**
 * ProtectedRoute - Simple authentication guard
 * Just checks if user exists in memory (AuthVerifier handles JWT verification)
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useUser()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
