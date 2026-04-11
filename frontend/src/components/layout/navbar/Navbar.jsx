'use client';

import { Search, User, Menu, ChevronDown, Settings, FolderOpen, LogOut } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../../ui"
import { useUser } from "../../../store/useUser"
import "./Navbar.css"

function Navbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const { user, logout } = useUser()
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">PROYECTO HORNERO</Link>

        <div className="navbar-search">
          <Search className="navbar-search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar proyectos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="navbar-search-input"
            aria-label="Buscar proyectos"
          />
        </div>

        <div className="navbar-actions">
          <Link to="/for-creators" className="navbar-creators-link">
            <Button variant="ghost" className="navbar-creators-btn">Para creadores</Button>
          </Link>

          {user ? (
            <div className="navbar-user-dropdown" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                className="navbar-login-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <User size={18} aria-hidden="true" />
                <span className="navbar-login-text">
                  {user.firstName || user.userName}
                  {(user.role === 'CREATOR' || user.role === 'ADMIN') && (
                    <span className={`navbar-role-badge navbar-role-badge--${user.role.toLowerCase()}`}>
                      {user.role === 'ADMIN' ? 'Admin' : 'Creador'}
                    </span>
                  )}
                </span>
                <ChevronDown size={14} className={`navbar-chevron ${userDropdownOpen ? 'navbar-chevron--open' : ''}`} aria-hidden="true" />
              </Button>
              {userDropdownOpen && (
                <div className="navbar-dropdown-menu">
                  <Link
                    to="/configuracion"
                    className="navbar-dropdown-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Settings size={16} aria-hidden="true" />
                    Configuración
                  </Link>
                  <Link
                    to="/campaigns"
                    className="navbar-dropdown-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <FolderOpen size={16} aria-hidden="true" />
                    Mis campañas
                  </Link>
                  <div className="navbar-dropdown-divider" />
                  <button
                    className="navbar-dropdown-item navbar-dropdown-item--danger"
                    onClick={() => { handleLogout(); setUserDropdownOpen(false); }}
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="navbar-auth-link">
                <Button variant="ghost" size="sm" className="navbar-login-btn">
                  <User size={18} aria-hidden="true" />
                  <span className="navbar-login-text">Iniciar sesion</span>
                </Button>
              </Link>
              <Link to="/register" className="navbar-auth-link navbar-signup-link">
                <Button variant="primary" size="sm">Registrarse</Button>
              </Link>
            </>
          )}

          <button
            className="navbar-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Abrir menu de navegacion"
          >
            <Menu size={24} aria-hidden="true" />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="navbar-mobile-menu">
          <Link to="/for-creators" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>
            Para creadores
          </Link>
          {user ? (
            <>
              <Link to="/configuracion" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Configuración
              </Link>
              <Link to="/campaigns" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Mis campañas
              </Link>
              <button className="navbar-mobile-link" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Iniciar sesion
              </Link>
              <Link to="/register" className="navbar-mobile-link navbar-mobile-signup" onClick={() => setMobileMenuOpen(false)}>
                Registrarse
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar