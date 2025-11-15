// src/api.js

// Determina automáticamente la base URL según entorno
const BASE_URL = import.meta.env.VITE_API_URL

// Función genérica de request
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`

  console.log("ULR: ", url)
  console.log("Options: ", options)

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })

  // Manejo de errores genérico
  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Error ${response.status}: ${message}`)
  }

  // Si no hay contenido (DELETE o 204)
  if (response.status === 204) return null

  return response.json()
}

// Helpers para simplificar llamadas
export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

export default api
