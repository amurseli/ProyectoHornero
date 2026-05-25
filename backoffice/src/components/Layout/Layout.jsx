import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ShieldCheck, BadgeCheck, LogOut, User, Users, Landmark } from 'lucide-react'
import Button from '../Button/Button.jsx'
import { useUser } from '../../store/useUser'
import './Layout.css'

/** Left-side navigation entries. Add more items here as the panel grows. */
const NAV_ITEMS = [
  { to: '/verificaciones', label: 'Verificaciones', icon: BadgeCheck },
  { to: '/campanas', label: 'Campañas', icon: Landmark },
  { to: '/usuarios', label: 'Usuarios', icon: Users },
]

function Layout() {
  const { user, logout } = useUser()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="layout">
      <aside className="layout-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">
            <ShieldCheck size={22} />
          </span>
          <div>
            <div className="sidebar-brand-name">Proyecto Hornero</div>
            <div className="sidebar-brand-sub">Backoffice</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? 'sidebar-nav-link--active' : ''}`
                }
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-avatar">
              <User size={18} aria-hidden="true" />
            </span>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.firstName || user?.userName}</div>
              <div className="sidebar-user-email">{user?.email}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
