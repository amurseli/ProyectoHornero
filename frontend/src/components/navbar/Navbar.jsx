import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './Navbar.css'

function NavbarContent() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const isAuthenticated = false // TODO: reemplazar con estado real de login

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen)

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
        {isAuthenticated ? (
          <>
            {/* 🔹 Espacio para menú de usuario autenticado */}
            <button className="logout-button">Cerrar sesión</button>
          </>
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
