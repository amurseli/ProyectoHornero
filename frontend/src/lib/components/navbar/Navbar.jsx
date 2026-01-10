import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '$lib/store/useUser'
import './Navbar.css'

function NavbarContent() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { user, logout: logoutUser } = useUser()
  const navigate = useNavigate()

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen)

  const handleLogout = async () => {
    await logoutUser()
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
        {user ? (
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
