"use client"

import { FiSearch, FiUser, FiMenu } from "react-icons/fi"
import { useState } from "react"
import { Button } from "../../ui"
import "./Navbar.css"

function Navbar() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <a href="/" className="navbar-logo">
          CROWDFUND
        </a>

        <div className="navbar-search">
          <FiSearch className="navbar-search-icon" />
          <input
            type="text"
            placeholder="type to search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="navbar-search-input"
          />
        </div>

        <div className="navbar-actions">
          <Button variant="ghost" className="navbar-creators-btn">
            Para los creadores
          </Button>
          <Button variant="ghost" size="sm">
            <FiUser className="w-5 h-5" />
            <span className="navbar-login-text">Log in</span>
          </Button>
          <Button variant="primary" size="sm">
            Sign up
          </Button>
          <button className="navbar-menu-btn">
            <FiMenu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar