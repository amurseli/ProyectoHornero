'use client';

import { Search, User, Menu } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "../../ui"
import "./Navbar.css"

function Navbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          PROYECTO HORNERO
        </Link>

        {/* Search Bar */}
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

        {/* Actions */}
        <div className="navbar-actions">
          <Link to="/create" className="navbar-creators-link">
            <Button variant="ghost" className="navbar-creators-btn">
              Para creadores
            </Button>
          </Link>
          <Link to="/login" className="navbar-auth-link">
            <Button variant="ghost" size="sm" className="navbar-login-btn">
              <User size={18} aria-hidden="true" />
              <span className="navbar-login-text">Iniciar sesion</span>
            </Button>
          </Link>
          <Link to="/register" className="navbar-auth-link navbar-signup-link">
            <Button variant="primary" size="sm">
              Registrarse
            </Button>
          </Link>
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-menu">
          <Link to="/create" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>
            Para creadores
          </Link>
          <Link to="/login" className="navbar-mobile-link" onClick={() => setMobileMenuOpen(false)}>
            Iniciar sesion
          </Link>
          <Link to="/register" className="navbar-mobile-link navbar-mobile-signup" onClick={() => setMobileMenuOpen(false)}>
            Registrarse
          </Link>
        </div>
      )}
    </nav>
  )
}

export default Navbar
