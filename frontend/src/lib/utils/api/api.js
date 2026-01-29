// API utility for making HTTP requests
// Automatically handles JWT cookies, token refresh, and common error scenarios

const BASE_URL = import.meta.env.VITE_API_URL

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

// Generic request function - handles all HTTP methods
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  
  // Build headers
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  let response = await fetch(url, {
    headers,
    credentials: 'include', // Include cookies in requests
    ...options,
  })

  // Handle 401/403 Unauthorized - try to refresh token
  if ((response.status === 401 || response.status === 403) && !path.includes('/auth/refresh') && !path.includes('/login') && !path.includes('/register')) {
    const isPublicEndpoint = 
      (options.method === 'GET' && path.includes('/api/campaigns'))
    
    if (!isPublicEndpoint) {
      // Token expired, try to refresh
      if (isRefreshing) {
        // Wait for the ongoing refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => {
          // Retry original request after refresh
          return fetch(url, {
            headers,
            credentials: 'include',
            ...options,
          }).then(res => handleResponse(res, path, options))
        }).catch(err => {
          throw err
        })
      }

      isRefreshing = true

      try {
        // Call refresh endpoint
        const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include'
        })

        if (refreshResponse.ok) {
          // Refresh successful, retry original request
          isRefreshing = false
          processQueue(null)
          
          response = await fetch(url, {
            headers,
            credentials: 'include',
            ...options,
          })
        } else {
          // Refresh failed, logout user
          isRefreshing = false
          processQueue(new Error('Session expired'), null)
          
          // Clear user data and redirect to login
          window.dispatchEvent(new CustomEvent('auth:logout'))
          
          if (!window.location.pathname.includes('/login') && 
              !window.location.pathname.includes('/register') &&
              !window.location.pathname.includes('/verify-email') &&
              !window.location.pathname.includes('/reset-password') &&
              window.location.pathname !== '/') {
            window.location.href = '/login'
          }
          
          throw new Error('Session expired. Please login again.')
        }
      } catch (error) {
        isRefreshing = false
        processQueue(error, null)
        throw error
      }
    }
  }

  return handleResponse(response, path, options)
}

async function handleResponse(response, path, options) {
  // Handle error responses
  if (!response.ok) {
    // Try to parse error message from response
    let errorMessage = `Error ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorMessage
    } catch {
      // If response is not JSON, use text
      try {
        const text = await response.text()
        errorMessage = text || errorMessage
      } catch {
        // Use default error message
      }
    }
    
    throw new Error(errorMessage)
  }

  // Handle empty responses (DELETE, 204 No Content)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null
  }

  // Parse and return JSON response
  return response.json()
}

// Export API helpers for common HTTP methods
export const api = {
  get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
  post: (path, data, options = {}) => request(path, { 
    ...options, 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  put: (path, data, options = {}) => request(path, { 
    ...options, 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  patch: (path, data, options = {}) => request(path, { 
    ...options, 
    method: 'PATCH', 
    body: JSON.stringify(data) 
  }),
  delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' }),
}

export default api
