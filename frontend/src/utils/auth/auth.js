// Authentication utility functions
// Note: Token management is now handled by HttpOnly cookies (backend)
// Token refresh is handled automatically by api.js
// This file is maintained for backward compatibility but may be deprecated

/**
 * Check if user is authenticated
 * @deprecated Use useUser() hook from UserProvider instead
 * @returns {boolean} True if user data exists in storage
 */
export function isAuthenticated() {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
  return !!userStr
}

/**
 * Get the current user data from storage
 * @deprecated Use useUser() hook from UserProvider instead
 * @returns {Object|null} The user object or null if not found
 */
export function getUser() {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch (error) {
    console.error('Error parsing user data:', error)
    return null
  }
}

/**
 * Save authentication data after successful login/register
 * @deprecated User data is now managed by UserProvider context
 * @param {Object} authData - The authentication response from the server
 * @param {boolean} remember - Whether to persist in localStorage (true) or sessionStorage (false)
 */
export function saveAuth(authData, remember = true) {
  console.warn('saveAuth() is deprecated. Use UserProvider.login() instead.')
  const storage = remember ? localStorage : sessionStorage

  const userData = {
    userId: authData.userId,
    email: authData.email,
    userName: authData.userName,
    firstName: authData.firstName,
    role: authData.role
  }

  storage.setItem('user', JSON.stringify(userData))
}

/**
 * Clear all authentication data
 * @deprecated User data is now managed by UserProvider context
 */
export function clearAuth() {
  console.warn('clearAuth() is deprecated. Use UserProvider.logout() instead.')
  localStorage.removeItem('user')
  sessionStorage.removeItem('user')
}

/**
 * Logout user
 * @deprecated Use UserProvider.logout() instead
 * @param {boolean} redirect - Whether to redirect to login page
 */
export async function logout(redirect = true) {
  console.warn('logout() is deprecated. Use UserProvider.logout() instead.')

  try {
    // Call backend logout endpoint to clear HttpOnly cookie
    await fetch(`${import.meta.env.VITE_API_URL}/api/users/logout`, {
      method: 'POST',
      credentials: 'include'
    })
  } catch (error) {
    console.error('Error during logout:', error)
  }

  // Clear local user data
  clearAuth()

  if (redirect) {
    window.location.href = '/login'
  }
}

export default {
  saveAuth,
  getUser,
  isAuthenticated,
  clearAuth,
  logout
}
