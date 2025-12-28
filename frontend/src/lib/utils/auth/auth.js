// Authentication utility for managing JWT tokens and user data

/**
 * Save authentication data after successful login/register
 * Note: JWT token is now stored in HttpOnly cookie by backend
 * @param {Object} authData - The authentication response from the server
 * @param {boolean} remember - Whether to persist in localStorage (true) or sessionStorage (false)
 */
export function saveAuth(authData, remember = true) {
  const storage = remember ? localStorage : sessionStorage
  
  // Save user data (token is now in HttpOnly cookie)
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
 * Get the current user data from storage
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
 * Check if user is authenticated
 * Note: With HttpOnly cookies, we check for user data instead of token
 * @returns {boolean} True if user data exists
 */
export function isAuthenticated() {
  return !!getUser()
}

/**
 * Clear all authentication data
 * Note: HttpOnly cookie will be cleared by backend on logout
 */
export function clearAuth() {
  localStorage.removeItem('user')
  sessionStorage.removeItem('user')
}

/**
 * Logout user - calls backend to clear cookie, then clears local data
 * @param {boolean} redirect - Whether to redirect to login page
 */
export async function logout(redirect = true) {
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
