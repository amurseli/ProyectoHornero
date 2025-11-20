import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isAuthenticated, getUser, logout } from '$utils/auth/auth'
import './Navbar.css'

function NavbarContent() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check authentication status on mount and update state
    const updateAuthState = () => {
      setAuthenticated(isAuthenticated())
      setUser(getUser())
    }
    
    updateAuthState()
    
    // Listen for storage events (login/logout from other tabs or manual triggers)
    window.addEventListener('storage', updateAuthState)
    
    return () => {
      window.removeEventListener('storage', updateAuthState)
    }
  }, [])

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen)

  const handleLogout = async () => {
    await logout(false) // Don't auto-redirect, we'll do it manually
    setAuthenticated(false)
    setUser(null)
    navigate('/login')
  }

  return (
    <>
      <div className="navbar-brand">
        {/* 🔹 Ruta corregida: "/" en lugar de "/home" */}
        <Link to="/" className="navbar-brand-link">
          Proyecto Hornero
        </Link>
      </div>

      <div className="navbar-links">
        {/* 🔹 Links principales visibles */}
        <Link to="/campaigns" className="navbar-link">
          Campañas
        </Link>
        <Link to="/my-campaigns" className="navbar-link">
          Mis campañas
        </Link>
      </div>

      <div className="navbar-right">
        {authenticated ? (
          <div className="dropdown-container">
            <button
              className="dropdown-button"
              onClick={toggleDropdown}
              aria-expanded={isDropdownOpen}
            >
              {user?.userName || user?.firstName || 'Usuario'}
            </button>

            <div
              className={`dropdown-menu ${isDropdownOpen ? 'open' : ''}`}
              aria-hidden={!isDropdownOpen}
            >
              <div className="dropdown-item dropdown-user-info">
                <strong>{user?.firstName || 'Usuario'}</strong>
                <span className="user-email">{user?.email}</span>
              </div>
              <div className="dropdown-divider"></div>
              <button
                className="dropdown-item logout-item"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        ) : (
          <div className="dropdown-container">
            <button
              className="dropdown-button"
              onClick={toggleDropdown}
              aria-expanded={isDropdownOpen}
            >
              Cuenta
            </button>

            <div
              className={`dropdown-menu ${isDropdownOpen ? 'open' : ''}`}
              aria-hidden={!isDropdownOpen}
            >
              <Link
                className="dropdown-item"
                to="/register"
                onClick={toggleDropdown}
              >
                Registro
              </Link>
              <Link
                className="dropdown-item"
                to="/login"
                onClick={toggleDropdown}
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function Navbar() {
  return (
    <nav className="navbar-wrapper">
      <NavbarContent />
    </nav>
  )
}
