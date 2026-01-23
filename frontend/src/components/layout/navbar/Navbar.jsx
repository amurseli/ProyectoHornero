'use client';

import { Search, User, Menu, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../../ui"
import { getUser, logout } from "../../../utils/auth/auth"
import "./Navbar.css"

function Navbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = () => setUser(getUser())
    checkAuth()
    window.addEventListener('storage', checkAuth)
    return () => window.removeEventListener('storage', checkAuth)
  }, [])

  const handleLogout = async () => {
    await logout(false)
    setUser(null)
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
          <Link to="/create" className="navbar-creators-link">
            <Button variant="ghost" className="navbar-creators-btn">Para creadores</Button>
          </Link>

          {user ? (
            <>
              <Link to="/my-campaigns" className="navbar-auth-link">
                <Button variant="ghost" size="sm" className="navbar-login-btn">
                  <User size={18} aria-hidden="true" />
                  <span className="navbar-login-text">{user.firstName || user.userName}</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="navbar-logout-btn">
                <LogOut size={18} aria-hidden="true" />
              </Button>
            </>
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
          <Link to="/create" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>
            Para creadores
          </Link>
          {user ? (
            <>
              <Link to="/my-campaigns" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>
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