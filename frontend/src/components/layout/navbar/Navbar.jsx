'use client';

import { User, Menu, ChevronDown, Settings, FolderOpen, LogOut, ShieldCheck, Bookmark, Blocks } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../../ui"
import { NavbarSearchBar } from "../../features"
import { useUser } from "../../../store/useUser"
import "./Navbar.css"

function getBackofficeUrl() {
  const configured = import.meta.env.VITE_BACKOFFICE_URL
  if (configured) return configured

  if (typeof window === 'undefined') return 'http://localhost:5174/backoffice/'

  const { protocol, hostname, port } = window.location
  const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1'

  if (isLocalDev) {
    const backofficePort = port === '5174' ? port : '5174'
    return `${protocol}//${hostname}:${backofficePort}/backoffice/`
  }

  return `${window.location.origin}/backoffice/`
}

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const { user, logout } = useUser()
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const backofficeUrl = getBackofficeUrl()

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

        <NavbarSearchBar />

        <div className="navbar-actions">
          <Link to="/explorar" className="navbar-creators-link">
            <Button variant="ghost" className="navbar-creators-btn">Explorar</Button>
          </Link>
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
                    to="/my-campaigns"
                    className="navbar-dropdown-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <FolderOpen size={16} aria-hidden="true" />
                    Mis campañas
                  </Link>
                  <Link
                    to="/my-saved-campaigns"
                    className="navbar-dropdown-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Bookmark size={16} aria-hidden="true" />
                    Mis guardados
                  </Link>
                  <Link
                    to="/transactions"
                    className="navbar-dropdown-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Blocks size={16} aria-hidden="true" />
                    Transacciones
                  </Link>
                  {user.role === 'ADMIN' && (
                    <a
                      href={backofficeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="navbar-dropdown-item"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <ShieldCheck size={16} aria-hidden="true" />
                      Backoffice
                    </a>
                  )}
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
          <Link to="/explorar" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>
            Explorar
          </Link>
          <Link to="/for-creators" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>
            Para creadores
          </Link>
          {user ? (
            <>
              <Link to="/configuracion" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Configuración
              </Link>
              <Link to="/my-campaigns" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Mis campañas
              </Link>
              <Link to="/my-saved-campaigns" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Mis guardados
              </Link>
              <Link to="/transactions" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                Transacciones
              </Link>
              {user.role === 'ADMIN' && (
                <a
                  href={backofficeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="navbar-mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Backoffice
                </a>
              )}
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
