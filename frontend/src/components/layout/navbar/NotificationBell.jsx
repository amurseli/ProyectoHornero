import { Bell } from "lucide-react"
import { useEffect, useRef, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { notificationsService } from "../../../utils/notificationsService"
import "./NotificationBell.css"

const POLL_INTERVAL_MS = 60000

function formatRelativeTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const absSeconds = Math.abs(diffSeconds)
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

  if (absSeconds < 60) return rtf.format(diffSeconds, 'second')
  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute')
  const diffHours = Math.round(diffSeconds / 3600)
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour')
  const diffDays = Math.round(diffSeconds / 86400)
  return rtf.format(diffDays, 'day')
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const refreshUnreadCount = useCallback(async () => {
    try {
      const { count } = await notificationsService.getUnreadCount()
      setUnreadCount(count)
    } catch {
      // Silenciosamente ignorado: la campanita no debe interrumpir la navegación si el servicio no responde
    }
  }, [])

  useEffect(() => {
    refreshUnreadCount()
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [refreshUnreadCount])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const page = await notificationsService.getNotifications(0, 10)
      setNotifications(page.content || [])
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleOpen = () => {
    const next = !open
    setOpen(next)
    if (next) loadNotifications()
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await notificationsService.markAsRead(notification.id)
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch {
        // Si falla el marcado, igual navegamos: no es bloqueante para el usuario
      }
    }
    setOpen(false)
    if (notification.campaignId) {
      navigate(`/campaigns/${notification.campaignId}`)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // Sin feedback adicional: el usuario puede reintentar
    }
  }

  return (
    <div className="navbar-notification-bell" ref={dropdownRef}>
      <button
        className="navbar-notification-btn"
        onClick={toggleOpen}
        aria-label="Notificaciones"
        aria-expanded={open}
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="navbar-notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="navbar-notification-dropdown">
          <div className="navbar-notification-header">
            <span>Notificaciones</span>
            {unreadCount > 0 && (
              <button className="navbar-notification-mark-all" onClick={handleMarkAllAsRead}>
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="navbar-notification-list">
            {loading && <div className="navbar-notification-empty">Cargando...</div>}
            {!loading && notifications.length === 0 && (
              <div className="navbar-notification-empty">No tenés notificaciones</div>
            )}
            {!loading && notifications.map((notification) => (
              <button
                key={notification.id}
                className={`navbar-notification-item ${notification.read ? '' : 'navbar-notification-item--unread'}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <span className="navbar-notification-title">{notification.title}</span>
                <span className="navbar-notification-message">{notification.message}</span>
                <span className="navbar-notification-time">{formatRelativeTime(notification.createdAt)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
