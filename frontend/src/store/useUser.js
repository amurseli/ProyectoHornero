import { useContext } from 'react'
import { UserContext } from './UserContext'

/**
 * useUser hook - Access user store from any component
 * @returns {{ user, login, logout, isAuthenticated, loading }}
 *
 * Example:
 *   const { user, logout } = useUser()
 *   if (user) { ... }
 */
export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
