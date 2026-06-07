import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ShieldCheck, Search, UserX, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../../components'
import { useUser } from '../../store/useUser'
import api from '../../utils/api'
import { formatDate as formatBackendDate } from '../../utils/datetime'
import './Users.css'

function formatDate(value) {
  return formatBackendDate(value, '—')
}

function displayName(user) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return fullName || user.userName || user.email
}

export default function UsersPage() {
  const { user: currentUser, refreshUser } = useUser()
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totals, setTotals] = useState({ totalUsers: 0, totalAdmins: 0, totalBlocked: 0 })

  const fetchUsers = async (targetPage = 0) => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get(`/api/admin/users?page=${targetPage}&size=10`)
      setUsers(data.items || [])
      setPage(data.page || 0)
      setTotalPages(data.totalPages || 0)
      setTotals({
        totalUsers: data.totalUsers || 0,
        totalAdmins: data.totalAdmins || 0,
        totalBlocked: data.totalBlocked || 0,
      })
    } catch (err) {
      setError(err.message || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(0)
  }, [])

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return users

    return users.filter((item) => {
      const haystack = [
        item.email,
        item.userName,
        item.firstName,
        item.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalized)
    })
  }, [users, query])

  const stats = useMemo(() => ({
    total: totals.totalUsers,
    admins: totals.totalAdmins,
    blocked: totals.totalBlocked,
  }), [totals])

  const handleSearch = (event) => {
    event.preventDefault()
    setPage(0)
  }

  const handlePromoteAdmin = async (targetUser) => {
    setActionLoading(`promote-${targetUser.id}`)
    setActionError(null)
    try {
      await api.post(`/api/admin/users/${targetUser.id}/promote-admin`, {})
      await fetchUsers(page)
      await refreshUser()
    } catch (err) {
      setActionError(err.message || 'No se pudo convertir al usuario en administrador')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveAdmin = async (targetUser) => {
    setActionLoading(`demote-${targetUser.id}`)
    setActionError(null)
    try {
      await api.post(`/api/admin/users/${targetUser.id}/remove-admin`, {})
      await fetchUsers(page)
      await refreshUser()
    } catch (err) {
      setActionError(err.message || 'No se pudo quitar el rol de administrador')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleEnabled = async (targetUser, enabled) => {
    setActionLoading(`status-${targetUser.id}`)
    setActionError(null)
    try {
      await api.patch(`/api/admin/users/${targetUser.id}/status`, { enabled })
      await fetchUsers(page)
      await refreshUser()
    } catch (err) {
      setActionError(err.message || 'No se pudo actualizar el estado del usuario')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="users-page">
      <div className="au-container">
        <div className="au-header">
          <div>
            <h1>Usuarios</h1>
            <p>Promové usuarios a administrador y bloqueá cuentas que no deban seguir operando.</p>
          </div>
          <div className="au-stats">
            <div className="au-stat-card">
              <span className="au-stat-value">{stats.total}</span>
              <span className="au-stat-label">Usuarios</span>
            </div>
            <div className="au-stat-card">
              <span className="au-stat-value">{stats.admins}</span>
              <span className="au-stat-label">Admins</span>
            </div>
            <div className="au-stat-card">
              <span className="au-stat-value">{stats.blocked}</span>
              <span className="au-stat-label">Bloqueados</span>
            </div>
          </div>
        </div>

        <form className="au-toolbar" onSubmit={handleSearch}>
          <div className="au-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar por email, username o nombre"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" size="sm">Buscar</Button>
        </form>

        {error && <div className="au-error">{error}</div>}
        {actionError && <div className="au-error">{actionError}</div>}

        {loading ? (
          <div className="au-loading">Cargando usuarios...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="au-empty">
            <AlertCircle size={40} />
            <p>No se encontraron usuarios.</p>
          </div>
        ) : (
          <div className="au-list">
            {filteredUsers.map((item) => {
              const isCurrentUser = currentUser?.userId === item.id
              const isAdmin = item.role === 'ADMIN'
              const isBlocked = item.enabled === false

              return (
                <article key={item.id} className={`au-card ${isBlocked ? 'au-card--blocked' : ''}`}>
                  <div className="au-card-main">
                    <div className="au-user-heading">
                      <strong>{displayName(item)}</strong>
                      <div className="au-badges">
                        {isCurrentUser && (
                          <span className="au-badge au-badge--self">VOS</span>
                        )}
                        <span className={`au-badge ${isAdmin ? 'au-badge--admin' : 'au-badge--role'}`}>
                          {item.role || '—'}
                        </span>
                        <span className={`au-badge ${isBlocked ? 'au-badge--blocked' : 'au-badge--active'}`}>
                          {isBlocked ? 'Bloqueado' : 'Activo'}
                        </span>
                        {item.emailVerified === false && (
                          <span className="au-badge au-badge--pending">Email no verificado</span>
                        )}
                      </div>
                    </div>
                    <div className="au-user-meta">
                      <span>{item.email}</span>
                      <span>@{item.userName}</span>
                      <span>Alta: {formatDate(item.createdAt)}</span>
                      {item.disabledAt && <span>Bloqueado: {formatDate(item.disabledAt)}</span>}
                      {isCurrentUser && <span>Este sos vos</span>}
                    </div>
                  </div>

                  <div className="au-actions">
                    {!isAdmin && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="au-action-btn au-action-btn--promote"
                        onClick={() => handlePromoteAdmin(item)}
                        disabled={actionLoading === `promote-${item.id}`}
                      >
                        <ShieldCheck size={16} /> Hacer admin
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        variant="danger"
                        size="sm"
                        className="au-action-btn au-action-btn--demote"
                        onClick={() => handleRemoveAdmin(item)}
                        disabled={actionLoading === `demote-${item.id}`}
                      >
                        <ShieldCheck size={16} /> Quitar admin
                      </Button>
                    )}

                    {isBlocked ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleToggleEnabled(item, true)}
                        disabled={actionLoading === `status-${item.id}`}
                      >
                        <UserCheck size={16} /> Desbloquear
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleToggleEnabled(item, false)}
                        disabled={actionLoading === `status-${item.id}` || isCurrentUser}
                        title={isCurrentUser ? 'No podés bloquear tu propio usuario' : undefined}
                      >
                        <UserX size={16} /> Bloquear
                      </Button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="au-pagination">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchUsers(page - 1)}
              disabled={page <= 0}
            >
              <ChevronLeft size={16} /> Anterior
            </Button>
            <span className="au-pagination-label">
              Página {page + 1} de {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchUsers(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Siguiente <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
