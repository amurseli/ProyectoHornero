import { useContext } from 'react'
import { UserContext } from './UserContext'

/**
 * useUser hook - Access the admin user store from any component
 * @returns {{ user, login, logout, refreshUser, isAuthenticated, loading }}
 */
export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
