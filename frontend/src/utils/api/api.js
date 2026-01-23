// API utility for making HTTP requests
// Automatically handles JWT cookies and common error scenarios

const BASE_URL = import.meta.env.VITE_API_URL

// Generic request function - handles all HTTP methods
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  
  // Build headers
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  const response = await fetch(url, {
    headers,
    credentials: 'include', // Include cookies in requests
    ...options,
  })

  // Handle error responses
  if (!response.ok) {
    // If unauthorized, clear user data and redirect to login
    // BUT skip redirect for public endpoints (like GET /api/campaigns)
    if (response.status === 401) {
      const isPublicEndpoint = 
        (options.method === 'GET' && path.includes('/api/campaigns')) ||
        path.includes('/login') ||
        path.includes('/register')
      
      if (!isPublicEndpoint) {
        localStorage.removeItem('user')
        sessionStorage.removeItem('user')
        
        // Only redirect if not already on login/register page or home
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register') &&
            window.location.pathname !== '/') {
          window.location.href = '/login'
        }
      }
    }
    
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
