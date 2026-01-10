import React, { useEffect, useState } from 'react'
import { UserContext } from './UserContext'

/**
 * UserProvider - Global user store accessible from any component
 * Stores user data from JWT response (id, email, userName, firstName, role)
 * Similar to Svelte's $page but for user state
 * Data lives only in React context (in-memory), not in localStorage/sessionStorage
 * Authentication is handled by HttpOnly JWT cookie on the backend
 */
export function UserProvider({ children }) {
  // User state lives only in React context (in-memory)
  const [user, setUserState] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch current user from JWT cookie on mount
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
          credentials: 'include'
        })       
        if (response.ok) {
          const userData = await response.json()
          setUserState({
            userId: userData.userId,
            email: userData.email,
            userName: userData.userName,
            firstName: userData.firstName,
            role: userData.role
          })
        } else if (response.status === 401 || response.status === 403) {
          // JWT expired or missing, try to refresh
          const refreshResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include'
          })
          
          if (refreshResponse.ok) {
            // Refresh successful, retry fetching user
            const retryResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
              credentials: 'include'
            })
            
            if (retryResponse.ok) {
              const userData = await retryResponse.json()
              setUserState({
                userId: userData.userId,
                email: userData.email,
                userName: userData.userName,
                firstName: userData.firstName,
                role: userData.role
              })
            }
          }
          // If refresh fails, user stays null (logged out)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentUser()
  }, [])

  /**
   * Login - Set user data from backend response
   * @param {Object} userData - User data from login/register response
   */
  const login = (userData) => {
    const user = {
      userId: userData.userId,
      email: userData.email,
      userName: userData.userName,
      firstName: userData.firstName,
      role: userData.role
    }
    setUserState(user)
  }

  /**
   * Logout - Clear user data and call backend to clear HttpOnly cookie
   */
  const logout = async () => {
    try {
      // Call backend to clear HttpOnly JWT cookie and revoke refresh token
      await fetch(`${import.meta.env.VITE_API_URL}/api/users/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Error during logout:', error)
    }

    // Clear user state
    setUserState(null)
  }

  // Listen for automatic logout from API (when refresh token fails)
  useEffect(() => {
    const handleAutoLogout = () => {
      setUserState(null)
    }
    
    window.addEventListener('auth:logout', handleAutoLogout)
    return () => window.removeEventListener('auth:logout', handleAutoLogout)
  }, [])

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = () => !!user

  const value = {
    user,           // Current user object or null
    login,          // Login function to set user
    logout,         // Logout function to clear user
    isAuthenticated, // Helper to check if logged in
    loading         // Loading state while fetching user
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
