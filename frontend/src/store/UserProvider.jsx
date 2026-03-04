import React, { useEffect, useState } from 'react'
import { UserContext } from './UserContext'
import api from '../utils/api/api'

/**
 * UserProvider - Global user state management
 * Stores user data in React context (in-memory only)
 * JWT cookies are managed by backend, refresh handled by api.js
 */
export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  /**
   * Fetch current user data from JWT cookie
   * api.js automatically handles token refresh if needed
   */
  const fetchUser = async () => {
    try {
      const userData = await api.get('/api/users/me')
      setUser({
        userId: userData.userId,
        email: userData.email,
        userName: userData.userName,
        firstName: userData.firstName,
        role: userData.role
      })
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
   * Refresh user data from the server (e.g. after profile update)
   */
  const refreshUser = async () => {
    try {
      const userData = await api.get('/api/users/me')
      setUser({
        userId: userData.userId,
        email: userData.email,
        userName: userData.userName,
        firstName: userData.firstName,
        role: userData.role
      })
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  /**
   * Set user data after login/register
   */
  const login = (userData) => {
    setUser({
      userId: userData.userId,
      email: userData.email,
      userName: userData.userName,
      firstName: userData.firstName,
      role: userData.role
    })
  }

  /**
   * Clear user data and invalidate backend session
   */
  const logout = async () => {
    try {
      await api.post('/api/users/logout')
    } catch (error) {
      console.error('Logout request failed:', error)
    }
    setUser(null)
  }

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = () => !!user

  return (
    <UserContext.Provider value={{ user, login, logout, refreshUser, isAuthenticated, loading }}>
      {children}
    </UserContext.Provider>
  )
}
