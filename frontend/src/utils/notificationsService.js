const NOTIFICATIONS_URL = import.meta.env.VITE_NOTIFICATIONS_URL || 'http://localhost:8083'

async function request(path, options = {}) {
  const res = await fetch(`${NOTIFICATIONS_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Error ${res.status}`)
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return null
  }
  return res.json()
}

export const notificationsService = {
  getNotifications: (page = 0, size = 10, unreadOnly = false) =>
    request(`/api/notifications?page=${page}&size=${size}&unreadOnly=${unreadOnly}`),

  getUnreadCount: () =>
    request('/api/notifications/unread-count'),

  markAsRead: (notificationId) =>
    request(`/api/notifications/${notificationId}/read`, { method: 'PATCH' }),

  markAllAsRead: () =>
    request('/api/notifications/read-all', { method: 'PATCH' }),
}
