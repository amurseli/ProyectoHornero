import { Navigate } from 'react-router-dom'
import { useUser } from '../store/useUser'

/**
 * AdminRoute - Guards the backoffice.
 * Only authenticated ADMIN users (the only kind UserProvider stores) pass.
 * Everyone else is redirected to the login screen.
 */
export function AdminRoute({ children }) {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Cargando...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default AdminRoute
