import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './Navbar.css'

function NavbarContent() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isAuthenticated = false; // Placeholder for future auth state

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  return (
    <>
      <div className="navbar-brand">
        <Link to="/home" className="navbar-brand-link">Proyecto Hornero</Link>
      </div>
      <div className="navbar-right">
        {isAuthenticated ? (
          <>
            {/* authenticated actions (omitted for now) */}
          </>
        ) : (
          <div className="dropdown-container">
            <button className="dropdown-button" onClick={toggleDropdown}>Cuenta</button>
            <div className={`dropdown-menu ${isDropdownOpen ? 'open' : ''}`} aria-hidden={!isDropdownOpen}>
              <Link className="dropdown-item" to="/register" onClick={toggleDropdown}>Registro</Link>
              <Link className="dropdown-item" to="/login" onClick={toggleDropdown}>Iniciar Sesión</Link>
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
