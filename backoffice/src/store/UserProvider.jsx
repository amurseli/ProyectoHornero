import { useEffect, useState } from 'react'
import { UserContext } from './UserContext'
import api from '../utils/api'

/**
 * Shape the raw /api/users/me response into the user object we keep in memory.
 */
function mapUser(userData) {
  return {
    userId: userData.userId,
    email: userData.email,
    userName: userData.userName,
    firstName: userData.firstName,
    role: userData.role,
  }
}

/**
 * UserProvider - Global admin user state for the backoffice.
 * Only users with the ADMIN role are considered authenticated here;
 * any other role is treated as "not logged in".
 */
export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  /**
   * Fetch current user from the JWT cookie. Non-admins are rejected.
   */
  const fetchUser = async () => {
    try {
      const userData = await api.get('/api/users/me')
      setUser(userData.role === 'ADMIN' ? mapUser(userData) : null)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setUser(null)
    }
  }

  // Load user on app startup
  useEffect(() => {
    fetchUser().finally(() => setLoading(false))
  }, [])

  // Listen for automatic logout (triggered by api.js when refresh fails)
  useEffect(() => {
    const handleLogout = () => setUser(null)
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  /**
   * Refresh user data from the server.
   */
  const refreshUser = async () => {
    await fetchUser()
  }

  /**
   * Set user data after a successful admin login.
   * Returns true if the user is an admin and was stored.
   */
  const login = (userData) => {
    if (userData.role !== 'ADMIN') return false
    setUser(mapUser(userData))
    return true
  }

  /**
   * Clear user data and invalidate the backend session.
   */
  const logout = async () => {
    try {
      await api.post('/api/users/logout')
    } catch (error) {
      console.error('Logout request failed:', error)
    }
    setUser(null)
  }

  const isAuthenticated = () => !!user

  return (
    <UserContext.Provider value={{ user, login, logout, refreshUser, isAuthenticated, loading }}>
      {children}
    </UserContext.Provider>
  )
}
