// API utility for the backoffice.
// Single interceptor for all requests - handles JWT refresh automatically.
// JWT/refresh tokens live in HttpOnly cookies managed by the backend.

const BASE_URL = import.meta.env.VITE_API_URL

// Refresh state management
let isRefreshing = false
let refreshQueue = []

/**
 * Process all queued requests after refresh completes
 */
function processRefreshQueue(error = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve()
  })
  refreshQueue = []
}

/**
 * Attempt to refresh JWT using refresh token cookie
 * @returns {boolean} True if refresh succeeded
 */
async function refreshAccessToken() {
  const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  return response.ok
}

/**
 * Handle session expiry - clear user and redirect to login.
 * In the backoffice the only public route is /login.
 */
function handleSessionExpired() {
  window.dispatchEvent(new CustomEvent('auth:logout'))

  if (!window.location.pathname.includes('/backoffice/login')) {
    window.location.href = '/backoffice/login'
  }
}

/**
 * Main request interceptor - handles JWT refresh automatically
 */
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  // Make initial request
  let response = await fetch(url, {
    headers,
    credentials: 'include', // Always send cookies
    ...options,
  })

  // Check if JWT is missing or expired (401/403)
  const isAuthError = response.status === 401 || response.status === 403
  const shouldNotRetry = path.includes('/auth/refresh') ||
                         path.includes('/login')

  if (isAuthError && !shouldNotRetry) {
    // JWT missing or expired - try to refresh

    if (isRefreshing) {
      // Wait for ongoing refresh to complete
      await new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      })

      // Retry request with new JWT
      response = await fetch(url, {
        headers,
        credentials: 'include',
        ...options,
      })
    } else {
      // Start refresh process
      isRefreshing = true

      try {
        const refreshSucceeded = await refreshAccessToken()

        if (refreshSucceeded) {
          // Got new JWT - retry original request
          isRefreshing = false
          processRefreshQueue()

          response = await fetch(url, {
            headers,
            credentials: 'include',
            ...options,
          })
        } else {
          // No valid refresh token - session expired
          isRefreshing = false
          const error = new Error('Session expired')
          processRefreshQueue(error)
          handleSessionExpired()
          throw error
        }
      } catch (error) {
        isRefreshing = false
        processRefreshQueue(error)
        throw error
      }
    }
  }

  return handleResponse(response)
}

/**
 * Parse response or throw error
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `Error ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorMessage
    } catch {
      try {
        const text = await response.text()
        errorMessage = text || errorMessage
      } catch {
        // Use default error message
      }
    }
    throw new Error(errorMessage)
  }

  // Handle empty responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null
  }

  return response.json()
}

// Export API helpers for common HTTP methods
export const api = {
  get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
  post: (path, data, options = {}) => request(path, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (path, data, options = {}) => request(path, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  patch: (path, data, options = {}) => request(path, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' }),
}

export default api
